// Definiciones de tipos para el slider

export type Direction = 'next' | 'prev' | 'none';

export interface SlideElements {
  track: HTMLElement;
  slides: HTMLElement[];
  prevBtn: HTMLElement | null;
  nextBtn: HTMLElement | null;
  dots: HTMLElement[];
}

export interface SliderDimensions {
  containerWidth: number;
  trackWidth: number;
  slideWidth: number;
}

export interface SliderState {
  currentIndex: number;
  lastIndex: number;
  totalSlides: number;
  autoplayTimer: number | null;
  animationDuration: string;
}

export interface SliderOptions {
  autoplayDelay?: number;
  animationDuration?: string;
  resumeAutoplayDelay?: number;
}

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
