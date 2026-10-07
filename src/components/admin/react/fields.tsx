import { useEffect, useId, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Input, Textarea } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { cn } from '@/lib/utils';

type BaseProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
    value: string;
    onValueChange: (value: string) => void;
  };

export function TextField({
  label,
  hint,
  error,
  className,
  value,
  onValueChange,
  ...props
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

type TextAreaFieldProps = BaseProps & {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export function TextAreaField({
  label,
  hint,
  className,
  value,
  onValueChange,
  placeholder,
  rows = 3,
}: TextAreaFieldProps) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        ref={ref}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className="overflow-hidden"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

type FieldsetProps = { legend: string; children: ReactNode; className?: string };

export function Fieldset({ legend, children, className }: FieldsetProps) {
  return (
    <fieldset className={cn('space-y-1.5', className)}>
      <legend className="mb-1.5 text-sm font-medium text-gray-300">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}
