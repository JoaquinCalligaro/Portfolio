import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import backgroundConfig from './backgroundConfig';
import { StarsBackground } from './dark-mode/StarsBackground';
import { ShootingStars } from './dark-mode/ShootingStarts';
import { StarsBackgroundLight } from './light-mode/StartsBackgroundLight';
import { ShootingStarsLight } from './light-mode/ShootingStarts';
import { useTheme } from '@/hooks/useTheme';

/**
 * SmoothBackgroundSwitcher
 * Componente alternativo a `BackgroundSwitcher` que agrega una transición suave
 * (crossfade) al cambiar entre dark y light mode para evitar cambios bruscos.
 *
 * Uso recomendado: reemplaza <BackgroundSwitcher /> por <SmoothBackgroundSwitcher />
 * dentro de tu layout. Mantiene pointer-events: none para no interferir con el UI.
 */
interface SmoothBackgroundSwitcherProps {
  className?: string;
  transitionDurationMs?: number; // Duración del fade-out del modo previo.
  // Permite sobrescribir parcialmente la config global si se pasa.
  configOverride?: Partial<typeof backgroundConfig>;
}

type Mode = 'dark' | 'light';

export const SmoothBackgroundSwitcher: FC<SmoothBackgroundSwitcherProps> = ({
  className = '',
  transitionDurationMs = 500,
  configOverride,
}) => {
  const isDark = useTheme();
  const targetMode: Mode = isDark ? 'dark' : 'light';

  // Config final (merge superficial por modo si se provee override)
  const cfg = configOverride
    ? ({
        dark: { ...backgroundConfig.dark, ...(configOverride.dark || {}) },
        light: { ...backgroundConfig.light, ...(configOverride.light || {}) },
      } as typeof backgroundConfig)
    : backgroundConfig;

  const [activeMode, setActiveMode] = useState<Mode>(targetMode);
  const [prevMode, setPrevMode] = useState<Mode | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Cuando cambia el modo externo iniciamos transición crossfade.
  useEffect(() => {
    if (targetMode === activeMode) return; // No cambio real.
    setPrevMode(activeMode);
    setActiveMode(targetMode);
    setIsTransitioning(true);

    // Limpiamos prev layer tras la duración del fade.
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setPrevMode(null);
      setIsTransitioning(false);
    }, transitionDurationMs);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [targetMode, activeMode, transitionDurationMs]);

  // Helpers para renderizar cada modo con sus props.
  const renderMode = (mode: Mode) => {
    const mCfg = cfg[mode];
    const sCfg = mCfg.stars;
    const shCfg = mCfg.shooting;
    const isDarkMode = mode === 'dark';
    const StarsComp = isDarkMode ? StarsBackground : StarsBackgroundLight;
    const ShootingComp = isDarkMode ? ShootingStars : ShootingStarsLight;
    return (
      <>
        <StarsComp
          starDensity={sCfg.starDensity}
          allStarsTwinkle={sCfg.allStarsTwinkle}
          twinkleProbability={sCfg.twinkleProbability}
          minTwinkleSpeed={sCfg.minTwinkleSpeed}
          maxTwinkleSpeed={sCfg.maxTwinkleSpeed}
          intensity={sCfg.intensity}
          className={`${sCfg.backgroundClass || ''} ${mCfg.zIndex.background}`}
        />
        <ShootingComp
          starColor={shCfg.starColor}
          trailColor={shCfg.trailColor}
          minSpeed={shCfg.minSpeed}
          maxSpeed={shCfg.maxSpeed}
          minDelay={shCfg.minDelay}
          maxDelay={shCfg.maxDelay}
          starWidth={shCfg.starWidth}
          starHeight={shCfg.starHeight}
          className={mCfg.zIndex.shooting}
        />
      </>
    );
  };

  return (
    <div className={`pointer-events-none fixed inset-0 ${className}`}>
      {/* Capa previa (fade out) */}
      {prevMode && (
        <div
          className="absolute inset-0"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transition: `opacity ${transitionDurationMs}ms ease-in-out`,
          }}
          aria-hidden="true"
        >
          {renderMode(prevMode)}
        </div>
      )}
      {/* Capa activa */}
      <div className="absolute inset-0" style={{ opacity: 1 }}>
        {renderMode(activeMode)}
      </div>
    </div>
  );
};

export default SmoothBackgroundSwitcher;
