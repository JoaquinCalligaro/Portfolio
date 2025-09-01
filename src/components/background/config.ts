// Archivo de configuración del background
// Edita los valores aquí para ajustar la intensidad, color y comportamiento
// de las capas (estrellas, conexiones, nebulosa) sin tocar el componente.

export const LIGHT_MODE_CONFIG = {
  // aumenta la cantidad de estrellas en modo claro
  starsCountMultiplier: 1.6,
  // multiplica la opacidad de las estrellas
  starsOpacityMultiplier: 1.8,
  // aumenta el parpadeo de las estrellas
  starsTwinkleBoost: 2,
  // multiplicador de nodos/conexiones
  connectionsCountMultiplier: 2,
  // multiplica la opacidad de las conexiones
  connectionsOpacityMultiplier: 2,
  // multiplicador general de intensidad de nebulosa
  nebulaIntensityMultiplier: 2.0,
  // boost de saturación para la nebulosa en light
  nebulaSaturationBoost: 1.3,
  // boost de luminosidad para la nebulosa en light
  nebulaLightnessBoost: 1.5,
};

export const DARK_MODE_CONFIG = {
  // multiplicador de cantidad de estrellas en modo oscuro (por defecto 1)
  starsCountMultiplier: 1.0,
  // multiplicador de opacidad de estrellas en modo oscuro
  starsOpacityMultiplier: 1.0,
  // ajuste del parpadeo de las estrellas en modo oscuro
  starsTwinkleBoost: 1.0,
  // multiplicador de nodos/conexiones en modo oscuro
  connectionsCountMultiplier: 1.0,
  // multiplicador de opacidad de conexiones en modo oscuro
  connectionsOpacityMultiplier: 1.0,
  // multiplicador general de intensidad de nebulosa en modo oscuro
  nebulaIntensityMultiplier: 1.0,
  // boost de saturación para la nebulosa en modo oscuro
  nebulaSaturationBoost: 1.0,
  // boost de luminosidad para la nebulosa en modo oscuro
  nebulaLightnessBoost: 1.0,
};

export default { LIGHT_MODE_CONFIG, DARK_MODE_CONFIG };
