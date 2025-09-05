import type { Direction } from './types';

/**
 * Ajusta los tamaños del slider según el contenedor
 */
export function setSizes(
  container: HTMLElement,
  root: HTMLElement,
  track: HTMLElement,
  slides: HTMLElement[],
  currentIndex: number,
  totalSlides: number
): void {
  const cw = container.clientWidth || root.clientWidth || 0;
  // Si el contenedor está oculto (ej. display:none) evitamos establecer anchos a 0
  if (!cw) return;
  track.style.width = `${cw * totalSlides}px`; // Ancho total = ancho contenedor × número de slides
  slides.forEach((s) => (s.style.width = `${cw}px`)); // Cada slide ocupa el ancho completo
  track.style.transform = `translateX(${-currentIndex * cw}px)`; // Posicionar en slide actual
}

/**
 * Observador/fallback para cuando el slider está inicialmente dentro de un
 * contenedor oculto (por ejemplo el panel "extra-projects" con la clase "hidden").
 * Si el ancho es 0, aguardamos a que el contenedor sea visible antes de llamar al callback.
 */
export function waitForVisibilityAndSetSizes(
  container: HTMLElement,
  root: HTMLElement,
  callback: () => void
): void {
  const cw = container.clientWidth || root.clientWidth || 0;
  if (cw) {
    callback();
    return;
  }

  // Observador de cambios de atributos (clase/style) en el root para detectar cuando se muestre
  const observer = new MutationObserver(() => {
    const cw2 = container.clientWidth || root.clientWidth || 0;
    if (cw2) {
      observer.disconnect();
      clearInterval(poll);
      callback();
    }
  });
  observer.observe(root, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class', 'style'],
  });

  // Fallback por si no se producen mutations (chequeo periódico)
  const poll = setInterval(() => {
    const cw3 = container.clientWidth || root.clientWidth || 0;
    if (cw3) {
      try {
        observer.disconnect();
      } catch {
        try {
          observer.disconnect();
        } catch {
          void 0;
        }
      }
      clearInterval(poll);
      callback();
    }
  }, 200);
}

/**
 * Actualiza el estado visual de los dots (puntos indicadores)
 */
export function updateActiveDot(
  dots: HTMLElement[],
  activeIndex: number
): void {
  dots.forEach(function (dot, index) {
    // Remover clases activas de todos los dots
    dot.classList.remove('bg-gray-800', 'dark:bg-white');
    dot.classList.add('bg-gray-400', 'dark:bg-gray-400');

    // Activar el dot correspondiente al slide actual
    if (index === activeIndex) {
      dot.classList.remove('bg-gray-400', 'dark:bg-gray-400');
      dot.classList.add('bg-gray-800', 'dark:bg-white');
    }
  });
}

/**
 * Aplica efecto de animación fade con transición suave
 * Aplicar animación de entrada según dirección (prevIndex -> currentIndex)
 */
export function applyFadeEffect(
  slides: HTMLElement[],
  prevIndex: number,
  curIndex: number,
  direction: Direction,
  animationDuration: string
): void {
  const currentSlide = slides[curIndex];
  const previousSlide = slides[prevIndex];

  if (currentSlide) {
    // Remover clases de animación relacionadas (entradas y salidas)
    currentSlide.classList.remove(
      'animate-fade-in-right',
      'animate-fade-in-left',
      'animate-fade-out-left',
      'animate-fade-out-right'
    );

    if (previousSlide && previousSlide !== currentSlide) {
      previousSlide.classList.remove(
        'animate-fade-in-right',
        'animate-fade-in-left',
        'animate-fade-out-left',
        'animate-fade-out-right'
      );

      // Salida inmediata del slide anterior según dirección
      // Aplicar duración y salida según dirección
      previousSlide.style.animationDuration = animationDuration;
      if (direction === 'next') {
        previousSlide.classList.add('animate-fade-out-left');
      } else if (direction === 'prev') {
        previousSlide.classList.add('animate-fade-out-right');
      } else {
        previousSlide.classList.add('animate-fade-out-left');
      }

      // Limpiar clases/estilos cuando termine la animación de salida
      previousSlide.addEventListener(
        'animationend',
        () => {
          previousSlide.classList.remove(
            'animate-fade-out-left',
            'animate-fade-out-right'
          );
          previousSlide.style.animationDuration = '';
        },
        { once: true }
      );
    }

    // Aplicar animación de entrada INMEDIATAMENTE (no esperar a que termine la carga de imágenes)
    // Esto asegura que el efecto se vea en el momento del cambio de slide
    currentSlide.style.opacity = '1';
    currentSlide.style.animationDuration = animationDuration;

    // Entrada según dirección
    if (direction === 'next') {
      currentSlide.classList.add('animate-fade-in-right');
    } else if (direction === 'prev') {
      currentSlide.classList.add('animate-fade-in-left');
    } else {
      currentSlide.classList.add('animate-fade-in-right');
    }

    // Limpiar clases/estilos cuando termine la animación de entrada
    currentSlide.addEventListener(
      'animationend',
      () => {
        currentSlide.classList.remove(
          'animate-fade-in-right',
          'animate-fade-in-left'
        );
        currentSlide.style.animationDuration = '';
      },
      { once: true }
    );
  }
}

/**
 * Funciones para mostrar/ocultar flechas de navegación
 */
export function showArrows(
  prevBtn: HTMLElement | null,
  nextBtn: HTMLElement | null
): void {
  if (prevBtn) prevBtn.style.opacity = '1'; // Mostrar flecha anterior
  if (nextBtn) nextBtn.style.opacity = '1'; // Mostrar flecha siguiente
}

export function hideArrows(
  prevBtn: HTMLElement | null,
  nextBtn: HTMLElement | null
): void {
  if (prevBtn) prevBtn.style.opacity = '0'; // Ocultar flecha anterior
  if (nextBtn) nextBtn.style.opacity = '0'; // Ocultar flecha siguiente
}
