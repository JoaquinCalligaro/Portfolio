/* eslint-env browser */
/* eslint-disable no-undef */
// Client-side slider initializer (browser-only)
export function initSlider(sliderId) {
  if (!sliderId) return;

  try {
    // Obtener el elemento raíz del slider
    const root =
      typeof sliderId === 'string'
        ? document.getElementById(sliderId)
        : sliderId;
    if (!root) return;

    // Seleccionar todos los elementos necesarios del DOM
    const container = root.querySelector('.group') || root;
    const track = root.querySelector('.slider-track');
    const slides = Array.from(root.querySelectorAll('.slide'));
    const prevBtn = root.querySelector('.slider-prev');
    const nextBtn = root.querySelector('.slider-next');
    const dots = Array.from(root.querySelectorAll('.slider-dot'));

    // Variables de configuración
    const totalSlides = slides.length;
    if (!track || totalSlides <= 1) return; // No inicializar si no hay suficientes slides

    let currentIndex = 0; // Slide actual
    let autoplayTimer = null; // Timer para autoplay
    const animationDuration = '800ms'; // Duración de las animaciones para suavizar

    // Función para ajustar tamaños del slider según el contenedor
    function setSizes() {
      const cw = container.clientWidth || root.clientWidth || 0;
      track.style.width = `${cw * totalSlides}px`; // Ancho total = ancho contenedor × número de slides
      slides.forEach((s) => (s.style.width = `${cw}px`)); // Cada slide ocupa el ancho completo
      track.style.transform = `translateX(${-currentIndex * cw}px)`; // Posicionar en slide actual
    }

    // Esperar a que las imágenes carguen para calcular tamaños correctamente
    const imgs = root.querySelectorAll('img');
    let loaded = 0;
    if (imgs.length === 0) {
      setTimeout(setSizes, 50); // Si no hay imágenes, ajustar tamaño inmediatamente
    } else {
      imgs.forEach((img) => {
        if (img.complete) {
          loaded++;
        } else {
          img.addEventListener('load', () => {
            loaded++;
            if (loaded === imgs.length) setTimeout(setSizes, 50); // Cuando todas las imágenes carguen
          });
        }
      });
    }

    // Configurar tamaños iniciales y al redimensionar ventana
    setSizes();
    setTimeout(setSizes, 200); // Segundo ajuste por seguridad
    window.addEventListener('resize', setSizes); // Reajustar al cambiar tamaño de ventana

    // Función para actualizar el estado visual de los dots (puntos indicadores)
    function updateActiveDot(activeIndex) {
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

    // Función para aplicar efecto de animación flip con transición suave
    // Aplicar animación de entrada según dirección (prevIndex -> currentIndex)
    function applyFadeEffect(prevIndex, curIndex, direction) {
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

    // Función principal para cambiar de slide
    function goToSlide(newIndex) {
      // Guardar índice previo
      const prev = currentIndex;

      // Manejar navegación circular y calcular destino
      let target;
      if (newIndex < 0) target = totalSlides - 1;
      else if (newIndex >= totalSlides) target = 0;
      else target = newIndex;

      // Determinar dirección: 'next' (hacia adelante) o 'prev' (hacia atrás)
      let direction;
      if (target === prev) direction = 'none';
      else if (prev === totalSlides - 1 && target === 0) direction = 'next';
      else if (prev === 0 && target === totalSlides - 1) direction = 'prev';
      else direction = target > prev ? 'next' : 'prev';

      // Actualizar índice actual
      currentIndex = target;

      // Calcular posición y mover el track
      const cw = container.clientWidth || root.clientWidth || 0;
      track.style.transform = `translateX(${-currentIndex * cw}px)`;

      // Actualizar indicadores visuales
      updateActiveDot(currentIndex);

      // Aplicar efecto de animación al slide actual indicando dirección
      applyFadeEffect(prev, currentIndex, direction);

      // Guardar lastIndex para usos futuros
      lastIndex = currentIndex;
    }

    // Función para iniciar el autoplay (reproducción automática)
    function startAutoplay() {
      stopAutoplay(); // Detener timer anterior si existe
      autoplayTimer = setInterval(() => goToSlide(currentIndex + 1), 4000); // Cambiar cada 4 segundos
    }

    // Función para detener el autoplay
    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    // Funciones para mostrar/ocultar flechas de navegación
    function showArrows() {
      if (prevBtn) prevBtn.style.opacity = '1'; // Mostrar flecha anterior
      if (nextBtn) nextBtn.style.opacity = '1'; // Mostrar flecha siguiente
    }

    function hideArrows() {
      if (prevBtn) prevBtn.style.opacity = '0'; // Ocultar flecha anterior
      if (nextBtn) nextBtn.style.opacity = '0'; // Ocultar flecha siguiente
    }

    // Inicializar flechas ocultas al cargar
    hideArrows();

    // Event listeners para botón anterior
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        stopAutoplay(); // Pausar autoplay cuando usuario interactúa
        goToSlide(currentIndex - 1); // Ir al slide anterior
        setTimeout(startAutoplay, 5000); // Reanudar autoplay después de 5 segundos
      });
    }

    // Event listeners para botón siguiente
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        stopAutoplay(); // Pausar autoplay cuando usuario interactúa
        goToSlide(currentIndex + 1); // Ir al slide siguiente
        setTimeout(startAutoplay, 5000); // Reanudar autoplay después de 5 segundos
      });
    }

    // Event listeners para dots (puntos de navegación)
    dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        stopAutoplay(); // Pausar autoplay cuando usuario interactúa
        goToSlide(index); // Ir directamente al slide seleccionado
        setTimeout(startAutoplay, 5000); // Reanudar autoplay después de 5 segundos
      });
    });

    // Event listeners para hover (pasar el mouse sobre el slider)
    root.addEventListener('mouseenter', () => {
      stopAutoplay(); // Pausar autoplay al hacer hover
      showArrows(); // Mostrar flechas de navegación
    });

    root.addEventListener('mouseleave', () => {
      startAutoplay(); // Reanudar autoplay al quitar el mouse
      hideArrows(); // Ocultar flechas de navegación
    });

    // Inicialización: activar primer dot y comenzar autoplay
    updateActiveDot(0);
    applyFadeEffect(0, 0, 'next'); // Aplicar efecto al slide inicial
    startAutoplay();
  } catch (error) {
    // Manejo de errores para debugging
    console.error('Error initializing slider:', error);
  }
}

export default initSlider;
