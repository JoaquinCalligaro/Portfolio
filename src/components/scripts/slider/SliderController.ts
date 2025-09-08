import type {
  SlideElements,
  SliderState,
  SliderOptions,
  Direction,
} from './types';
import {
  setSizes,
  waitForVisibilityAndSetSizes,
  updateActiveDot,
  applyFadeEffect,
  showArrows,
  hideArrows,
} from './slider-helpers';

export class SliderController {
  public root: HTMLElement;
  public container: HTMLElement;
  public elements: SlideElements;
  public state: SliderState;
  public options: SliderOptions;

  constructor(
    root: HTMLElement,
    container: HTMLElement,
    elements: SlideElements,
    options: SliderOptions = {}
  ) {
    this.root = root;
    this.container = container;
    this.elements = elements;
    this.options = {
      autoplayDelay: 8000,
      animationDuration: '1000ms',
      resumeAutoplayDelay: 10000,
      ...options,
    };

    this.state = {
      currentIndex: 0,
      lastIndex: 0,
      totalSlides: elements.slides.length,
      autoplayTimer: null,
      animationDuration: this.options.animationDuration || '800ms',
    };

    this.init();
  }

  private init(): void {
    this.setupSizes();
    this.setupEventListeners();
    this.initializeUI();
    this.startAutoplay();
  }

  private setupSizes(): void {
    // Esperar a que las imágenes carguen para ajustar tamaños correctamente.
    // Si el slider está dentro de un contenedor oculto (display:none), deferimos
    // el primer cálculo hasta que el contenedor sea visible para evitar establecer
    // anchos a 0 y provocar saltos/parpadeos.
    const imgs = this.root.querySelectorAll('img');
    let loaded = 0;

    imgs.forEach((img) => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener('load', () => {
          loaded++;
          // ajustar tamaños cuando todas las imágenes hayan cargado y el contenedor sea visible
          if (loaded === imgs.length) {
            waitForVisibilityAndSetSizes(this.container, this.root, () =>
              setTimeout(() => this.setSizes(), 50)
            );
          }
        });
      }
    });

    // Si no hay imágenes, o ya están completas, asegurar que llamamos a setSizes
    if (imgs.length === 0 || loaded === imgs.length) {
      waitForVisibilityAndSetSizes(this.container, this.root, () => {
        this.setSizes();
        setTimeout(() => this.setSizes(), 200); // Segundo ajuste por seguridad
      });
    }

    // Reajustar al cambiar tamaño de ventana
    window.addEventListener('resize', () => this.setSizes());
  }

  private setSizes(): void {
    setSizes(
      this.container,
      this.root,
      this.elements.track,
      this.elements.slides,
      this.state.currentIndex,
      this.state.totalSlides
    );
  }

  private setupEventListeners(): void {
    // Event listeners para botón anterior
    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopAutoplay(); // Pausar autoplay cuando usuario interactúa
        this.goToSlide(this.state.currentIndex - 1); // Ir al slide anterior
        setTimeout(
          () => this.startAutoplay(),
          this.options.resumeAutoplayDelay
        ); // Reanudar autoplay
      });
    }

    // Event listeners para botón siguiente
    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopAutoplay(); // Pausar autoplay cuando usuario interactúa
        this.goToSlide(this.state.currentIndex + 1); // Ir al slide siguiente
        setTimeout(
          () => this.startAutoplay(),
          this.options.resumeAutoplayDelay
        ); // Reanudar autoplay
      });
    }

    // Event listeners para dots (puntos de navegación)
    this.elements.dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopAutoplay(); // Pausar autoplay cuando usuario interactúa
        this.goToSlide(index); // Ir directamente al slide seleccionado
        setTimeout(
          () => this.startAutoplay(),
          this.options.resumeAutoplayDelay
        ); // Reanudar autoplay
      });
    });

    // Event listeners para hover (pasar el mouse sobre el slider)
    this.root.addEventListener('mouseenter', () => {
      this.stopAutoplay(); // Pausar autoplay al hacer hover
      showArrows(this.elements.prevBtn, this.elements.nextBtn); // Mostrar flechas de navegación
    });

    this.root.addEventListener('mouseleave', () => {
      this.startAutoplay(); // Reanudar autoplay al quitar el mouse
      hideArrows(this.elements.prevBtn, this.elements.nextBtn); // Ocultar flechas de navegación
    });
  }

  private initializeUI(): void {
    // Inicializar flechas ocultas al cargar
    hideArrows(this.elements.prevBtn, this.elements.nextBtn);

    // Inicialización: activar primer dot y aplicar efecto al slide inicial
    updateActiveDot(this.elements.dots, 0);
    applyFadeEffect(
      this.elements.slides,
      0,
      0,
      'next',
      this.state.animationDuration
    );

    // Marcar como inicializado
    try {
      if (this.root.dataset) this.root.dataset.sliderInitialized = 'true';
    } catch {
      void 0;
    }
  }

  /**
   * Función principal para cambiar de slide
   */
  public goToSlide(newIndex: number): void {
    // Guardar índice previo
    const prev = this.state.currentIndex;

    // Manejar navegación circular y calcular destino
    let target: number;
    if (newIndex < 0) target = this.state.totalSlides - 1;
    else if (newIndex >= this.state.totalSlides) target = 0;
    else target = newIndex;

    // Determinar dirección: 'next' (hacia adelante) o 'prev' (hacia atrás)
    let direction: Direction;
    if (target === prev) direction = 'none';
    else if (prev === this.state.totalSlides - 1 && target === 0)
      direction = 'next';
    else if (prev === 0 && target === this.state.totalSlides - 1)
      direction = 'prev';
    else direction = target > prev ? 'next' : 'prev';

    // Actualizar índice actual
    this.state.currentIndex = target;

    // Calcular posición y mover el track
    const cw = this.container.clientWidth || this.root.clientWidth || 0;
    this.elements.track.style.transform = `translateX(${-this.state.currentIndex * cw}px)`;

    // Actualizar indicadores visuales
    updateActiveDot(this.elements.dots, this.state.currentIndex);

    // Aplicar efecto de animación al slide actual indicando dirección
    applyFadeEffect(
      this.elements.slides,
      prev,
      this.state.currentIndex,
      direction,
      this.state.animationDuration
    );

    // Guardar lastIndex para usos futuros
    this.state.lastIndex = this.state.currentIndex;
  }

  /**
   * Función para iniciar el autoplay (reproducción automática)
   */
  public startAutoplay(): void {
    this.stopAutoplay(); // Detener timer anterior si existe
    this.state.autoplayTimer = window.setInterval(
      () => this.goToSlide(this.state.currentIndex + 1),
      this.options.autoplayDelay
    );
  }

  /**
   * Función para detener el autoplay
   */
  public stopAutoplay(): void {
    if (this.state.autoplayTimer) {
      clearInterval(this.state.autoplayTimer);
      this.state.autoplayTimer = null;
    }
  }

  /**
   * Limpieza del slider
   */
  public destroy(): void {
    this.stopAutoplay();
    window.removeEventListener('resize', () => this.setSizes());
    // Aquí podrían agregarse más limpieza si fuera necesario
  }
}
