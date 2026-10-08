import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import { enterTransition, fadeUp } from './motion';

type RevealProps = { children: ReactNode; delay?: number; className?: string };

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={{ ...enterTransition, delay }}
    >
      {children}
    </m.div>
  );
}
