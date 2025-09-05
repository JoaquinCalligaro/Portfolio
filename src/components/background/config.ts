// Configuración del fondo animado del sitio
// OPTIMIZADO: Se añadieron constantes para controlar cantidades base y permitir
// reducir el coste en CPU. Las capas ahora pueden leer estos valores en lugar de
// usar números mágicos dentro de cada componente.

// Resolución interna (0.5 = renderiza a la mitad y se escala con transform)
// Esto reduce el fill‑rate y el coste por pixel en ~75% en escenas complejas.
export const INTERNAL_RESOLUTION_SCALE = 0.5; // Ajusta a 0.6/0.7 si querés más nitidez

// Cantidades base (antes estaban hardcodeadas: 200, 15, 180). Ajustadas a la baja.
export const BASE_STARS_COUNT = 140; // antes 200
export const BASE_CONNECTIONS_COUNT = 10; // antes 15
export const BASE_NEBULA_PARTICLES = 120; // antes 180

// Configuración para modo claro (ligeramente reducida respecto a la original para bajar carga)
export const LIGHT_MODE_CONFIG = {
  // Multiplicadores de intensidad para modo claro (reducidos para no duplicar demasiado)
  starsCountMultiplier: 1.2, // antes 1.6
  starsOpacityMultiplier: 1.5, // antes 1.8
  starsTwinkleBoost: 1.6, // antes 2
  connectionsCountMultiplier: 1.5, // antes 2
  connectionsOpacityMultiplier: 1.6, // antes 2
  nebulaIntensityMultiplier: 1.6, // antes 2.0
  nebulaSaturationBoost: 1.2, // antes 1.3
  nebulaLightnessBoost: 1.3, // antes 1.5
};

// Configuración para modo oscuro (sin cambios agresivos pero homogéneos)
export const DARK_MODE_CONFIG = {
  starsCountMultiplier: 1.0,
  starsOpacityMultiplier: 1.0,
  starsTwinkleBoost: 1.0,
  connectionsCountMultiplier: 1.0,
  connectionsOpacityMultiplier: 1.0,
  nebulaIntensityMultiplier: 1.0,
  nebulaSaturationBoost: 1.0,
  nebulaLightnessBoost: 1.0,
};

export default {
  LIGHT_MODE_CONFIG,
  DARK_MODE_CONFIG,
  INTERNAL_RESOLUTION_SCALE,
  BASE_STARS_COUNT,
  BASE_CONNECTIONS_COUNT,
  BASE_NEBULA_PARTICLES,
};
