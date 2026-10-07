import { MorphIcon } from 'morphicons/react';
import { ICON_PATHS, type IconName } from './icons';

type MorphGlyphProps = {
  name: IconName;
  size?: number;
  className?: string;
};

export function MorphGlyph({ name, size = 20, className }: MorphGlyphProps) {
  return (
    <MorphIcon
      icon={ICON_PATHS[name]}
      size={size}
      strokeWidth={1.75}
      reducedMotion="user"
      className={className}
    />
  );
}
