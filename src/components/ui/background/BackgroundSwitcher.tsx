import type { FC } from 'react';
import { StarsBackground } from './dark-mode/StarsBackground';
import { ShootingStars } from './dark-mode/ShootingStarts';
import { StarsBackgroundLight } from './light-mode/StartsBackgroundLight';
import { ShootingStarsLight } from './light-mode/ShootingStarts';

interface BackgroundSwitcherProps {
  starDensity?: number;
  className?: string;
  // Dark mode shooting stars
  darkStarColor?: string;
  darkTrailColor?: string;
  // Light mode shooting stars
  lightStarColor?: string;
  lightTrailColor?: string;
  // Shared shooting star behavior
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starWidth?: number;
  starHeight?: number;
  // z-index controls
  backgroundZ?: string; // e.g. '-z-30'
  starsZ?: string; // e.g. '-z-20'
}

// React component wrapper to switch backgrounds based on .dark class on <html>
export const BackgroundSwitcher: FC<BackgroundSwitcherProps> = ({
  starDensity = 0.0002,
  className = '',
  darkStarColor = '#9E00FF',
  darkTrailColor = '#2EB9DF',
  lightStarColor = '#4338CA',
  lightTrailColor = '#0EA5E9',
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starWidth = 10,
  starHeight = 1,
  backgroundZ = '-z-30',
  starsZ = '-z-20',
}) => {
  return (
    <div className={`pointer-events-none fixed inset-0 ${className}`}>
      {/* Dark mode */}
      <div className="hidden dark:block">
        <StarsBackground starDensity={starDensity} className={backgroundZ} />
        <ShootingStars
          starColor={darkStarColor}
          trailColor={darkTrailColor}
          minSpeed={minSpeed}
          maxSpeed={maxSpeed}
          minDelay={minDelay}
          maxDelay={maxDelay}
          starWidth={starWidth}
          starHeight={starHeight}
          className={starsZ}
        />
      </div>
      {/* Light mode */}
      <div className="block dark:hidden">
        <StarsBackgroundLight
          starDensity={starDensity}
          className={backgroundZ}
        />
        <ShootingStarsLight
          starColor={lightStarColor}
          trailColor={lightTrailColor}
          minSpeed={minSpeed}
          maxSpeed={maxSpeed}
          minDelay={minDelay}
          maxDelay={maxDelay}
          starWidth={starWidth}
          starHeight={starHeight}
          className={starsZ}
        />
      </div>
    </div>
  );
};

export default BackgroundSwitcher;
