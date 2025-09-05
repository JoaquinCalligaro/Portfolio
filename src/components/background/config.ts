// Configuración del fondo animado del sitio
// Ajusta estos valores para cambiar la intensidad y comportamiento de las animaciones

// Configuración para modo claro
export const LIGHT_MODE_CONFIG = {
  // Multiplicadores de intensidad para modo claro
  starsCountMultiplier: 1.6,
  starsOpacityMultiplier: 1.8,
  starsTwinkleBoost: 2,
  connectionsCountMultiplier: 2,
  connectionsOpacityMultiplier: 2,
  nebulaIntensityMultiplier: 2.0,
  nebulaSaturationBoost: 1.3,
  nebulaLightnessBoost: 1.5,
};

// Configuración para modo oscuro
export const DARK_MODE_CONFIG = {
  // Valores base para modo oscuro (sin multiplicadores)
  starsCountMultiplier: 1.0,
  starsOpacityMultiplier: 1.0,
  starsTwinkleBoost: 1.0,
  connectionsCountMultiplier: 1.0,
  connectionsOpacityMultiplier: 1.0,
  nebulaIntensityMultiplier: 1.0,
  nebulaSaturationBoost: 1.0,
  nebulaLightnessBoost: 1.0,
};

// Exporta ambas configuraciones
export default { LIGHT_MODE_CONFIG, DARK_MODE_CONFIG };
