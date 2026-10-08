import { forwardRef } from 'react';
import { m, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { hoverLift, tapPress } from '@/components/admin/react/motion';

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-500 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-cyan-500 text-gray-950 hover:bg-cyan-400',
        secondary: 'bg-gray-800 text-gray-100 hover:bg-gray-700',
        outline:
          'border border-white/20 text-gray-200 hover:border-cyan-400/50 hover:text-cyan-300',
        ghost: 'text-gray-300 hover:bg-white/5 hover:text-cyan-300',
        destructive:
          'border border-red-500/30 text-red-300 hover:bg-red-500/10',
      },
      size: {
        default: 'min-h-11 px-5 py-2',
        sm: 'min-h-11 min-w-11 px-3 py-2',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'ref'> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, type = 'button', ...props }, ref) => (
    <m.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : hoverLift}
      whileTap={disabled ? undefined : tapPress}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

type ButtonLinkProps = Omit<HTMLMotionProps<'a'>, 'ref'> &
  VariantProps<typeof buttonVariants>;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, ...props }, ref) => (
    <m.a
      ref={ref}
      whileHover={hoverLift}
      whileTap={tapPress}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
ButtonLink.displayName = 'ButtonLink';
