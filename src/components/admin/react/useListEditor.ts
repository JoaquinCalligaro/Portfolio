import { useCallback, useEffect, useRef, useState } from 'react';
import { announceChange, request, type ApiResult } from './api';

export type Values = Record<string, string | boolean>;

export type Status = { tone: 'info' | 'ok' | 'error'; text: string } | null;

export type EditorItem = {
  key: string;
  id: string;
  values: Values;
  saved: string;
  hidden: boolean;
  busy: boolean;
  fresh: boolean;
  status: Status;
};

export type InitialItem = { id: string; values: Values; hidden?: boolean };

export type Adapter = {
  save(item: EditorItem, items: EditorItem[]): Promise<ApiResult>;
  remove(item: EditorItem, items: EditorItem[]): Promise<ApiResult>;
  reorder(items: EditorItem[]): Promise<ApiResult>;
  toggleHidden(item: EditorItem, hidden: boolean): Promise<ApiResult>;
};

type Config = {
  endpoint?: string;
  parentField?: string;
  parentId?: string;
  blank: Values;
  initial: InitialItem[];
  adapter?: Adapter;
};

let keyCounter = 0;
const nextKey = () => `new-${++keyCounter}`;

const serialize = (values: Values) => JSON.stringify(values);

function toItem(raw: InitialItem, key: string): EditorItem {
  return {
    key,
    id: raw.id,
    values: raw.values,
    saved: serialize(raw.values),
    hidden: raw.hidden ?? false,
    busy: false,
    fresh: false,
    status: null,
  };
}

function restAdapter(config: Config): Adapter {
  const endpoint = config.endpoint ?? '';
  return {
    save: (item) =>
      item.id
        ? request(`${endpoint}/${item.id}`, 'PATCH', item.values)
        : request(endpoint, 'POST', {
            ...item.values,
            ...(config.parentField
              ? { [config.parentField]: config.parentId ?? '' }
              : {}),
          }),
    remove: (item) => request(`${endpoint}/${item.id}`, 'DELETE'),
    reorder: (items) =>
      request(`${endpoint}/reorder`, 'POST', {
        ids: items.map((i) => i.id).filter(Boolean),
      }),
    toggleHidden: (item, hidden) =>
      request(`${endpoint}/${item.id}`, 'PATCH', { hidden }),
  };
}

export function isDirty(item: EditorItem) {
  return serialize(item.values) !== item.saved;
}

export function useListEditor(config: Config) {
  const [items, setItems] = useState<EditorItem[]>(() =>
    config.initial.map((raw, index) => toItem(raw, `init-${index}`))
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const configRef = useRef(config);
  configRef.current = config;
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const adapter = useCallback(
    () => configRef.current.adapter ?? restAdapter(configRef.current),
    []
  );

  const patch = useCallback((key: string, changes: Partial<EditorItem>) => {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item))
    );
  }, []);

  const find = (key: string) => itemsRef.current.find((i) => i.key === key);

  const setField = useCallback(
    (key: string, field: string, value: string | boolean) => {
      setItems((current) =>
        current.map((item) =>
          item.key === key
            ? {
                ...item,
                values: { ...item.values, [field]: value },
                status: null,
              }
            : item
        )
      );
    },
    []
  );

  const add = useCallback(() => {
    const item: EditorItem = {
      ...toItem({ id: '', values: { ...configRef.current.blank } }, nextKey()),
      saved: '',
      fresh: true,
    };
    setItems((current) => [...current, item]);
  }, []);

  const flash = (key: string, status: Status) => {
    patch(key, { status });
    if (status?.tone === 'ok') {
      timers.current.push(
        window.setTimeout(() => {
          setItems((current) =>
            current.map((item) =>
              item.key === key && item.status?.tone === 'ok'
                ? { ...item, status: null }
                : item
            )
          );
        }, 3000)
      );
    }
  };

  const save = useCallback(
    async (key: string) => {
      const item = find(key);
      if (!item || item.busy) return;
      patch(key, { busy: true, status: { tone: 'info', text: 'Guardando…' } });
      const result = await adapter().save(item, itemsRef.current);
      if (!result.ok) {
        patch(key, {
          busy: false,
          status: {
            tone: 'error',
            text: result.error ?? 'No se pudo guardar',
          },
        });
        return;
      }
      const returned = result.item;
      const values: Values = { ...item.values };
      if (returned) {
        for (const field of Object.keys(values)) {
          const value = returned[field];
          if (typeof value === 'string') values[field] = value;
        }
      }
      patch(key, {
        busy: false,
        id: returned?.id ? String(returned.id) : item.id,
        values,
        saved: serialize(values),
        fresh: false,
      });
      flash(key, { tone: 'ok', text: 'Guardado' });
      announceChange(result);
    },
    [adapter, patch]
  );

  const move = useCallback(
    async (key: string, direction: -1 | 1) => {
      const current = itemsRef.current;
      const from = current.findIndex((i) => i.key === key);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      setItems(next);
      if (!next.some((i) => i.id)) return;
      patch(key, { status: { tone: 'info', text: 'Guardando…' } });
      const result = await adapter().reorder(next);
      if (!result.ok) {
        setItems(current);
        flash(key, {
          tone: 'error',
          text: result.error ?? 'No se pudo reordenar',
        });
        return;
      }
      flash(key, { tone: 'ok', text: 'Orden guardado' });
      announceChange(result);
    },
    [adapter, patch]
  );

  const toggleHidden = useCallback(
    async (key: string) => {
      const item = find(key);
      if (!item) return;
      const hidden = !item.hidden;
      if (!item.id) {
        patch(key, { hidden });
        return;
      }
      patch(key, { status: { tone: 'info', text: 'Guardando…' } });
      const result = await adapter().toggleHidden(item, hidden);
      if (!result.ok) {
        flash(key, {
          tone: 'error',
          text: result.error ?? 'No se pudo guardar',
        });
        return;
      }
      patch(key, { hidden, status: null });
      announceChange(result);
    },
    [adapter, patch]
  );

  const remove = useCallback(
    async (key: string) => {
      const item = find(key);
      if (!item) return;
      if (item.id) {
        patch(key, { busy: true, status: { tone: 'info', text: 'Borrando…' } });
        const result = await adapter().remove(item, itemsRef.current);
        if (!result.ok) {
          patch(key, { busy: false });
          flash(key, {
            tone: 'error',
            text: result.error ?? 'No se pudo borrar',
          });
          return;
        }
        announceChange(result);
      }
      setItems((current) => current.filter((i) => i.key !== key));
    },
    [adapter, patch]
  );

  return { items, add, setField, save, move, toggleHidden, remove };
}
