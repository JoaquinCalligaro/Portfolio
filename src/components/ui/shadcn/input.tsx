import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldClass =
  'block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-gray-100 transition-colors duration-500 placeholder:text-gray-400 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none disabled:opacity-50 aria-invalid:border-red-400';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClass, className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClass, 'resize-none', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
