import type { FC } from 'react';
import { StarsBackground } from './dark-mode/StarsBackground';
import { ShootingStars } from './dark-mode/ShootingStarts';
import { StarsBackgroundLight } from './light-mode/StartsBackgroundLight';
import { ShootingStarsLight } from './light-mode/ShootingStarts';
import backgroundConfig from '.';

interface BackgroundSwitcherProps {
  className?: string;
  // Permite sobrescribir parcialmente la config global si se pasa.
  configOverride?: Partial<typeof backgroundConfig>;
}

// React component wrapper to switch backgrounds based on .dark class on <html>
export const BackgroundSwitcher: FC<BackgroundSwitcherProps> = ({
  className = '',
  configOverride,
}) => {
  const cfg = configOverride
    ? ({
        dark: { ...backgroundConfig.dark, ...(configOverride.dark || {}) },
        light: { ...backgroundConfig.light, ...(configOverride.light || {}) },
      } as typeof backgroundConfig)
    : backgroundConfig;

  const dShoot = cfg.dark.shooting;
  const dStars = cfg.dark.stars;
  const dZ = cfg.dark.zIndex;
  const lShoot = cfg.light.shooting;
  const lStars = cfg.light.stars;
  const lZ = cfg.light.zIndex;
  return (
    <div className={`pointer-events-none fixed inset-0 ${className}`}>
      {/* Dark mode */}
      <div className="hidden dark:block">
        <StarsBackground
          starDensity={dStars.starDensity}
          allStarsTwinkle={dStars.allStarsTwinkle}
          twinkleProbability={dStars.twinkleProbability}
          minTwinkleSpeed={dStars.minTwinkleSpeed}
          maxTwinkleSpeed={dStars.maxTwinkleSpeed}
          className={`${dStars.backgroundClass || ''} ${dZ.background}`}
        />
        <ShootingStars
          starColor={dShoot.starColor}
          trailColor={dShoot.trailColor}
          minSpeed={dShoot.minSpeed}
          maxSpeed={dShoot.maxSpeed}
          minDelay={dShoot.minDelay}
          maxDelay={dShoot.maxDelay}
          starWidth={dShoot.starWidth}
          starHeight={dShoot.starHeight}
          className={dZ.shooting}
        />
      </div>
      {/* Light mode */}
      <div className="block dark:hidden">
        <StarsBackgroundLight
          starDensity={lStars.starDensity}
          allStarsTwinkle={lStars.allStarsTwinkle}
          twinkleProbability={lStars.twinkleProbability}
          minTwinkleSpeed={lStars.minTwinkleSpeed}
          maxTwinkleSpeed={lStars.maxTwinkleSpeed}
          className={`${lStars.backgroundClass || ''} ${lZ.background}`}
        />
        <ShootingStarsLight
          starColor={lShoot.starColor}
          trailColor={lShoot.trailColor}
          minSpeed={lShoot.minSpeed}
          maxSpeed={lShoot.maxSpeed}
          minDelay={lShoot.minDelay}
          maxDelay={lShoot.maxDelay}
          starWidth={lShoot.starWidth}
          starHeight={lShoot.starHeight}
          className={lZ.shooting}
        />
      </div>
    </div>
  );
};

export default BackgroundSwitcher;
