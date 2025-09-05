/* eslint-env browser */
import { SliderController } from './SliderController';
import type { SliderOptions, SlideElements } from './types';

/**
 * Función principal para inicializar el slider
 * Mantiene compatibilidad con la interfaz original
 */
export function initSlider(
  sliderId: string | HTMLElement,
  options: SliderOptions = {}
): SliderController | null {
  if (!sliderId) return null;

  try {
    // Obtener el elemento raíz del slider
    const root =
      typeof sliderId === 'string'
        ? document.getElementById(sliderId)
        : sliderId;
    if (!root) return null;

    // Evitar múltiples inicializaciones sobre el mismo elemento
    try {
      if (root.dataset && root.dataset.sliderInitialized === 'true')
        return null;
    } catch {
      /* noop */
    }

    // Seleccionar todos los elementos necesarios del DOM
    const container = (root.querySelector('.group') as HTMLElement) || root;
    const track = root.querySelector('.slider-track') as HTMLElement;
    const slides = Array.from(root.querySelectorAll('.slide')) as HTMLElement[];
    const prevBtn = root.querySelector('.slider-prev') as HTMLElement | null;
    const nextBtn = root.querySelector('.slider-next') as HTMLElement | null;
    const dots = Array.from(
      root.querySelectorAll('.slider-dot')
    ) as HTMLElement[];

    // Validar elementos necesarios
    const totalSlides = slides.length;
    if (!track || totalSlides <= 1) return null; // No inicializar si no hay suficientes slides

    // Crear objeto de elementos
    const elements: SlideElements = {
      track,
      slides,
      prevBtn,
      nextBtn,
      dots,
    };

    // Crear y retornar el controlador del slider
    const controller = new SliderController(root, container, elements, options);
    return controller;
  } catch (error) {
    // Manejo de errores para debugging
    console.error('Error initializing slider:', error);
    return null;
  }
}

export default initSlider;

// Expose para uso sin bundling (cuando se carga via <script type="module" src="...">)
try {
  if (typeof window !== 'undefined') {
    (window as typeof window & { initSlider: typeof initSlider }).initSlider =
      initSlider;
  }
} catch {
  // noop
}

// Re-exportar tipos para uso externo
export type {
  SliderOptions,
  SliderController as SliderControllerType,
} from './types';
export { SliderController } from './SliderController';
