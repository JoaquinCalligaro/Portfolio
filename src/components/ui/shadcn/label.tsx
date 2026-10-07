import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export const Label = forwardRef<
  ComponentRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('block text-sm font-medium text-gray-300', className)}
    {...props}
  />
));
Label.displayName = 'Label';
