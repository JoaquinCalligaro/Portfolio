import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { Switch } from '@/components/ui/shadcn/switch';
import { cn } from '@/lib/utils';
import { MotionRoot } from './MotionRoot';
import { Fieldset, TextAreaField, TextField } from './fields';
import { MorphGlyph } from './MorphGlyph';
import { openPreview } from './preview';
import { announceChange, request, uploadFile } from './api';
import { SPRING, statusTransition } from './motion';

export type ProjectValues = {
  id: string;
  titleEs: string;
  descriptionEs: string;
  repo: string;
  live: string;
  technologies: string[];
  images: string[];
  featured: boolean;
  hidden: boolean;
};

const TECH_OPTIONS = [
  'html',
  'css',
  'tailwind',
  'javascript',
  'typescript',
  'react',
];

const EMPTY: ProjectValues = {
  id: '',
  titleEs: '',
  descriptionEs: '',
  repo: '',
  live: '',
  technologies: [],
  images: [],
  featured: false,
  hidden: false,
};

type ProjectFormProps = { mode: 'create' | 'edit'; project?: ProjectValues };

export default function ProjectForm({ mode, project }: ProjectFormProps) {
  const [values, setValues] = useState<ProjectValues>(project ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const patch = (changes: Partial<ProjectValues>) =>
    setValues((current) => ({ ...current, ...changes }));

  const toggleTech = (tech: string) =>
    patch({
      technologies: values.technologies.includes(tech)
        ? values.technologies.filter((t) => t !== tech)
        : [...values.technologies, tech],
    });

  const addImages = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const result = await uploadFile(file, 'image', 'projects');
      if (!result.ok || !result.url) {
        toast.error(result.error ?? 'No se pudo subir la imagen');
        break;
      }
      urls.push(result.url);
    }
    setUploading(false);
    if (urls.length > 0) {
      setValues((current) => ({
        ...current,
        images: [...current.images, ...urls],
      }));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const { id, ...payload } = values;
    const result = await request(
      mode === 'create' ? '/api/admin/projects' : `/api/admin/projects/${id}`,
      mode === 'create' ? 'POST' : 'PATCH',
      payload
    );
    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? 'Error al guardar el proyecto');
      return;
    }
    toast.success(mode === 'create' ? 'Proyecto creado' : 'Cambios guardados');
    announceChange(result);
    window.setTimeout(
      () => {
        window.location.href = '/admin/projects';
      },
      result.warning ? 1800 : 900
    );
  };

  return (
    <MotionRoot>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-5" noValidate>
            <p className="text-sm text-gray-300">
              Escribí solo en español: el inglés se traduce automáticamente al
              guardar.
            </p>
            <TextField
              label="Título"
              required
              value={values.titleEs}
              onValueChange={(v) => patch({ titleEs: v })}
            />
            <TextAreaField
              label="Descripción"
              rows={4}
              value={values.descriptionEs}
              onValueChange={(v) => patch({ descriptionEs: v })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Link al repositorio (GitHub)"
                type="url"
                value={values.repo}
                onValueChange={(v) => patch({ repo: v })}
              />
              <TextField
                label="Link de la demo en vivo"
                type="url"
                value={values.live}
                onValueChange={(v) => patch({ live: v })}
              />
            </div>

            <Fieldset legend="Tecnologías">
              <div className="flex flex-wrap gap-2">
                {TECH_OPTIONS.map((tech) => {
                  const active = values.technologies.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTech(tech)}
                      className={cn(
                        'min-h-11 cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors duration-500 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none',
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                          : 'border-white/20 text-gray-200 hover:border-cyan-400/50'
                      )}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            </Fieldset>

            <Fieldset legend="Imágenes">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() =>
                    document.getElementById('project-images')?.click()
                  }
                >
                  <MorphGlyph name="upload" />
                  {uploading ? 'Subiendo…' : 'Subir imágenes'}
                </Button>
                <input
                  id="project-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Elegir imágenes del proyecto"
                  onChange={(e) => {
                    void addImages(Array.from(e.target.files ?? []));
                    e.target.value = '';
                  }}
                />
              </div>
              <ul className="m-0 mt-3 flex flex-wrap gap-3 p-0">
                <AnimatePresence initial={false}>
                  {values.images.map((url, index) => (
                    <m.li
                      key={url}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ ...statusTransition, layout: SPRING }}
                      className="relative h-20 w-28 list-none overflow-hidden rounded-lg"
                    >
                      <img
                        src={url}
                        alt={`Imagen ${index + 1} del proyecto`}
                        width={112}
                        height={80}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={`Quitar imagen ${index + 1}`}
                        onClick={() =>
                          patch({
                            images: values.images.filter((_, i) => i !== index),
                          })
                        }
                        className="absolute top-1 right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/75 text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                      >
                        <MorphGlyph name="x" size={16} />
                      </button>
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Fieldset>

            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Label className="flex min-h-11 cursor-pointer items-center gap-3">
                <Switch
                  checked={values.featured}
                  onCheckedChange={(v) => patch({ featured: v })}
                />
                Destacado
              </Label>
              <Label className="flex min-h-11 cursor-pointer items-center gap-3">
                <Switch
                  checked={values.hidden}
                  onCheckedChange={(v) => patch({ hidden: v })}
                />
                Oculto
              </Label>
            </div>

            <AnimatePresence>
              {error && (
                <m.p
                  key="error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={statusTransition}
                  className="text-sm text-red-300"
                >
                  {error}
                </m.p>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => {
                    const { id, ...draft } = values;
                    openPreview({
                      section: 'projects',
                      id: mode === 'edit' ? id : undefined,
                      values: draft,
                      hidden: values.hidden,
                    });
                  }}
                >
                  <MorphGlyph name="preview" />
                  Previsualizar
                </Button>
                <Button type="submit" disabled={busy || uploading}>
                  {busy
                    ? 'Guardando…'
                    : mode === 'create'
                      ? 'Crear proyecto'
                      : 'Guardar cambios'}
                </Button>
              </div>
              <ButtonLink href="/admin/projects" variant="ghost">
                Cancelar
              </ButtonLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </MotionRoot>
  );
}
