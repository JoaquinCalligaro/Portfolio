import { useState } from 'react';
import { MotionRoot } from './MotionRoot';
import { ListEditor } from './ListEditor';
import { ChoiceField } from './ChoiceField';
import { TextAreaField, TextField } from './fields';

export type EducationEntry = {
  id: string;
  institution: string;
  datesEs: string;
  descriptionEs: string;
  iconKey: string;
  certificateMime: string;
  hidden: boolean;
};

const KINDS = [
  { value: 'university', label: 'Estudio' },
  { value: 'work', label: 'Trabajo' },
  { value: 'certificate', label: 'Certificado' },
];

const BLANK = {
  institution: '',
  datesEs: '',
  descriptionEs: '',
  iconKey: 'university',
  certificate: '',
  certificateMime: '',
};

const CERTIFICATE_ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp,image/gif';
const CERTIFICATE_MAX_BYTES = 3 * 1024 * 1024;

// Elegir, ver estado o quitar el certificado (se guarda con "Guardar").
function CertificateField({
  id,
  certificate,
  mime,
  set,
}: {
  id: string;
  certificate: string;
  mime: string;
  set: (field: string, value: string) => void;
}) {
  const [error, setError] = useState('');
  const pending = certificate.startsWith('data:');
  const saved = !pending && certificate !== 'remove' && mime !== '';

  function pick(file: File | undefined) {
    setError('');
    if (!file) return;
    if (!CERTIFICATE_ACCEPT.split(',').includes(file.type)) {
      setError('Tiene que ser una imagen o un PDF');
      return;
    }
    if (file.size > CERTIFICATE_MAX_BYTES) {
      setError('El archivo supera los 3 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('certificate', String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">Certificado (imagen o PDF, opcional)</p>
      <input
        type="file"
        accept={CERTIFICATE_ACCEPT}
        onChange={(e) => pick(e.target.files?.[0])}
        className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-cyan-200"
      />
      <p className="text-xs text-gray-400">
        {pending
          ? 'Archivo listo: tocá "Guardar" para subirlo.'
          : saved
            ? 'Hay un certificado cargado.'
            : 'Sin certificado.'}
        {saved && id && (
          <>
            {' '}
            <a
              href={`/api/education/${id}/certificate`}
              target="_blank"
              rel="noopener"
              className="text-cyan-300 underline"
            >
              Ver
            </a>
          </>
        )}
        {(saved || pending) && (
          <>
            {' '}
            <button
              type="button"
              onClick={() => set('certificate', saved ? 'remove' : '')}
              className="text-red-300 underline"
            >
              Quitar
            </button>
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EducationEditor({ items }: { items: EducationEntry[] }) {
  return (
    <MotionRoot>
      <ListEditor
        endpoint="/api/admin/education"
        previewSection="education"
        itemLabel="estudio"
        addLabel="Agregar estudio"
        emptyText="Todavía no agregaste ningún estudio."
        blank={BLANK}
        initial={items.map((item) => ({
          id: item.id,
          hidden: item.hidden,
          values: {
            institution: item.institution,
            datesEs: item.datesEs,
            descriptionEs: item.descriptionEs,
            iconKey: item.iconKey || 'university',
            certificate: '',
            certificateMime: item.certificateMime,
          },
        }))}
        renderFields={({ item, set }) => (
          <>
            <TextField
              label="Institución o empresa"
              value={String(item.values.institution)}
              onValueChange={(v) => set('institution', v)}
              placeholder="Ej. Universidad Tecnológica Nacional"
            />
            <TextField
              label="Fechas"
              value={String(item.values.datesEs)}
              onValueChange={(v) => set('datesEs', v)}
              placeholder="Feb 2022 - Sep 2024"
            />
            <TextAreaField
              label="Descripción"
              value={String(item.values.descriptionEs)}
              onValueChange={(v) => set('descriptionEs', v)}
              placeholder="Qué estudiaste o hiciste"
            />
            <ChoiceField
              label="Tipo"
              value={String(item.values.iconKey)}
              options={KINDS}
              onValueChange={(v) => set('iconKey', v)}
            />
            <CertificateField
              id={item.id}
              certificate={String(item.values.certificate ?? '')}
              mime={String(item.values.certificateMime ?? '')}
              set={set}
            />
          </>
        )}
      />
    </MotionRoot>
  );
}
