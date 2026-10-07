import { cn } from '@/lib/utils';
import { Fieldset } from './fields';

type Option = { value: string; label: string };

type ChoiceFieldProps = {
  label: string;
  value: string;
  options: Option[];
  onValueChange: (value: string) => void;
};

export function ChoiceField({
  label,
  value,
  options,
  onValueChange,
}: ChoiceFieldProps) {
  return (
    <Fieldset legend={label}>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onValueChange(option.value)}
              className={cn(
                'min-h-12 cursor-pointer rounded-lg border px-2 py-2 text-sm transition-colors duration-500 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none',
                active
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/20 text-gray-200 hover:border-cyan-400/50'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </Fieldset>
  );
}
