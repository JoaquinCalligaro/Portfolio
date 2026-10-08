export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  enter: 0.75,
  expand: 1.3,
  status: 0.45,
  hover: 0.5,
} as const;

export const SPRING = {
  type: 'spring',
  stiffness: 140,
  damping: 22,
} as const;

export const enterTransition = { duration: DURATION.enter, ease: EASE } as const;
export const expandTransition = { duration: DURATION.expand, ease: EASE } as const;
export const statusTransition = { duration: DURATION.status, ease: EASE } as const;
export const hoverTransition = { duration: DURATION.hover, ease: EASE } as const;

export const STAGGER = 0.09;

export const hoverLift = { scale: 1.03, transition: hoverTransition } as const;
export const tapPress = { scale: 0.98, transition: statusTransition } as const;

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: enterTransition,
} as const;

export const collapsed = { opacity: 0, height: 0 } as const;
export const expanded = { opacity: 1, height: 'auto' } as const;
