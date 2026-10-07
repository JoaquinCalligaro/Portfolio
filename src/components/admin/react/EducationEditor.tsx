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
};

export default function EducationEditor({ items }: { items: EducationEntry[] }) {
  return (
    <MotionRoot>
      <ListEditor
        endpoint="/api/admin/education"
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
          </>
        )}
      />
    </MotionRoot>
  );
}
