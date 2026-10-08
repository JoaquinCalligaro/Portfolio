import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { MotionRoot } from './MotionRoot';
import { TextAreaField, TextField } from './fields';
import { MorphGlyph } from './MorphGlyph';
import { openPreview } from './preview';
import { announceChange, request, uploadFile } from './api';

type ProfileValues = {
  name: string;
  headlineEs: string;
  photoUrl: string;
  cvUrl: string;
};

export default function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [values, setValues] = useState(profile);
  const [saved, setSaved] = useState(JSON.stringify(profile));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'photo' | 'cv' | null>(null);
  const dirty = JSON.stringify(values) !== saved;

  const set = (field: keyof ProfileValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const upload = async (file: File | undefined, kind: 'photo' | 'cv') => {
    if (!file) return;
    setUploading(kind);
    const result = await uploadFile(file, kind === 'photo' ? 'image' : 'raw');
    setUploading(null);
    if (!result.ok || !result.url) {
      toast.error(result.error ?? 'No se pudo subir el archivo');
      return;
    }
    set(kind === 'photo' ? 'photoUrl' : 'cvUrl')(result.url);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await request('/api/admin/profile', 'PATCH', values);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo guardar');
      return;
    }
    setSaved(JSON.stringify(values));
    toast.success('Perfil guardado');
    announceChange(result);
  };

  return (
    <MotionRoot>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-5" noValidate>
            <TextField
              label="Nombre"
              value={values.name}
              onValueChange={set('name')}
            />
            <TextAreaField
              label="Descripción de presentación"
              rows={4}
              value={values.headlineEs}
              onValueChange={set('headlineEs')}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Label>Foto</Label>
                <div className="flex items-center gap-4">
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-gray-800 ring-4 ring-cyan-400/10">
                    {values.photoUrl ? (
                      <img
                        src={values.photoUrl}
                        alt="Foto actual"
                        width={80}
                        height={80}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Sin foto</span>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <Button
                      variant="outline"
                      disabled={uploading === 'photo'}
                      onClick={() =>
                        document.getElementById('profile-photo')?.click()
                      }
                    >
                      <MorphGlyph name="upload" />
                      {uploading === 'photo' ? 'Subiendo…' : 'Cambiar foto'}
                    </Button>
                    <span className="text-xs text-gray-400">JPG o PNG</span>
                  </div>
                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Elegir foto"
                    onChange={(e) => {
                      void upload(e.target.files?.[0], 'photo');
                      e.target.value = '';
                    }}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Label>CV (PDF)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gray-800 text-xs font-semibold text-cyan-300">
                    PDF
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    {values.cvUrl ? (
                      <a
                        href={values.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-300 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                      >
                        Ver CV actual
                      </a>
                    ) : (
                      <span className="text-sm text-gray-300">
                        Todavía no subiste un CV.
                      </span>
                    )}
                    <Button
                      variant="outline"
                      disabled={uploading === 'cv'}
                      onClick={() =>
                        document.getElementById('profile-cv')?.click()
                      }
                    >
                      <MorphGlyph name="upload" />
                      {uploading === 'cv' ? 'Subiendo…' : 'Cambiar CV'}
                    </Button>
                  </div>
                  <input
                    id="profile-cv"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Elegir CV en PDF"
                    onChange={(e) => {
                      void upload(e.target.files?.[0], 'cv');
                      e.target.value = '';
                    }}
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => openPreview({ section: 'profile', values })}
                >
                  <MorphGlyph name="preview" />
                  Previsualizar
                </Button>
                <Button type="submit" disabled={!dirty || busy}>
                  {busy ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
              <span role="status" className="text-sm text-gray-300">
                {dirty ? 'Cambios sin guardar' : ''}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </MotionRoot>
  );
}
