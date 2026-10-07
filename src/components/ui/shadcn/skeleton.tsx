import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-lg bg-white/5 motion-safe:animate-pulse', className)}
      {...props}
    />
  );
}
