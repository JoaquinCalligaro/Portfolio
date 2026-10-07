import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { uploadFile } from './api';

const ICON_CDN = 'https://cdn.simpleicons.org/';

type IconFieldProps = {
  iconSlug: string;
  iconUrl: string;
  onChange: (field: 'iconSlug' | 'iconUrl', value: string) => void;
};

function previewSource(slug: string, url: string) {
  if (url) return url;
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean ? `${ICON_CDN}${encodeURIComponent(clean)}` : '';
}

export function IconField({ iconSlug, iconUrl, onChange }: IconFieldProps) {
  const id = useId();
  const fileId = `${id}-file`;
  const [failedSource, setFailedSource] = useState('');
  const [uploading, setUploading] = useState(false);
  const source = previewSource(iconSlug, iconUrl);
  const showImage = Boolean(source) && failedSource !== source;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const result = await uploadFile(file);
    setUploading(false);
    if (!result.ok || !result.url) {
      toast.error(result.error ?? 'No se pudo subir la imagen');
      return;
    }
    onChange('iconUrl', result.url);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Ícono</Label>
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gray-800 p-2">
          {showImage ? (
            <img
              src={source}
              alt=""
              width={40}
              height={40}
              onError={() => setFailedSource(source)}
              className="size-full object-contain"
            />
          ) : (
            <span className="text-center text-[10px] leading-tight text-gray-400">
              {source ? 'No existe' : 'Sin ícono'}
            </span>
          )}
        </div>
        <Input
          id={id}
          value={iconSlug}
          onChange={(e) => onChange('iconSlug', e.target.value)}
          placeholder="Nombre del ícono (ej. docker, github)"
          autoCapitalize="none"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById(fileId)?.click()}
        >
          {uploading ? 'Subiendo…' : 'o subí una imagen'}
        </Button>
        <input
          id={fileId}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label="Subir imagen del ícono"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {iconUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('iconUrl', '')}
          >
            Quitar imagen
          </Button>
        )}
      </div>
    </div>
  );
}
