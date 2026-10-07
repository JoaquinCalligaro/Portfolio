import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/shadcn/tooltip';

const loadFeatures = () =>
  import('./motionFeatures').then((module) => module.default);

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures}>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
