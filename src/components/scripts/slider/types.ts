// Tipos TypeScript para el sistema de slider/carrusel

// Dirección de navegación del slider
export type Direction = 'next' | 'prev' | 'none';

// Elementos HTML del slider
export interface SlideElements {
  track: HTMLElement;
  slides: HTMLElement[];
  prevBtn: HTMLElement | null;
  nextBtn: HTMLElement | null;
  dots: HTMLElement[];
}

// Dimensiones calculadas del slider
export interface SliderDimensions {
  containerWidth: number;
  trackWidth: number;
  slideWidth: number;
}

// Estado interno del slider
export interface SliderState {
  currentIndex: number;
  lastIndex: number;
  totalSlides: number;
  autoplayTimer: number | null;
  animationDuration: string;
}

// Opciones de configuración
export interface SliderOptions {
  autoplayDelay?: number;
  animationDuration?: string;
  resumeAutoplayDelay?: number;
}

// Interfaz principal del controlador del slider
export interface SliderController {
  root: HTMLElement;
  container: HTMLElement;
  elements: SlideElements;
  state: SliderState;
  options: SliderOptions;
  goToSlide: (newIndex: number) => void;
  startAutoplay: () => void;
  stopAutoplay: () => void;
  destroy?: () => void;
}
