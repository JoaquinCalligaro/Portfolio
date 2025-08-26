// (el eslint ignora los warnings)
/* eslint-env browser */
/* global document, window, console, MutationObserver, setTimeout, clearTimeout */

// show-more-projects.js
// Maneja la funcionalidad de mostrar/ocultar proyectos progresivamente
// Requiere: contenedor con id="extra-projects" y botón con id="show-more-projects"

export default function initShowMore(
  buttonId = 'show-more-projects',
  options = {}
) {
  // Configuración por defecto
  const config = {
    targetId: 'extra-projects',
    hiddenClass: 'hidden',
    chunkSize: 999, // 🔧 CAMBIAR AQUÍ: Número de tarjetas que aparecen por click
    autoUpdate: true, // 🔧 CAMBIAR AQUÍ: true = detecta cambios automáticamente
    observerDelay: 100, // Delay antes de actualizar tras detectar cambios
    containerTransitionDelay: 200, // 🆕 Delay antes de ocultar el contenedor
    onShow: null,
    onHide: null,
    onCardsChanged: null,
    ...options,
  };

  // Validar elementos del DOM
  const elements = getElements(buttonId, config);
  if (!elements) return;

  const { button, target, grid } = elements;

  // 🆕 Agregar clases CSS para transiciones suaves al contenedor
  setupContainerTransitions(target);

  // Estado del componente
  const state = {
    currentCardCount: 0,
    isCollapsed: true,
  };

  // Configurar estado inicial
  initializeCards(button, grid, config.hiddenClass, config.chunkSize, state);

  // Configurar evento del botón
  setupButtonListener(button, target, grid, config, state);

  // Configurar observador de cambios automático
  if (config.autoUpdate) {
    setupCardObserver(button, grid, config, state);
  }

  // Escuchar cambios de idioma globales y actualizar texto del botón
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    window.addEventListener('langChange', () => {
      try {
        updateCardsState(button, grid, config, state);
      } catch {
        // noop
      }
    });
  }

  // Retornar función para actualización manual
  return {
    updateCards: () => updateCardsManually(button, grid, config, state),
    getCurrentCount: () => Array.from(grid.children).length,
    getRevealedCount: () =>
      getRevealedCount(Array.from(grid.children), config.hiddenClass),
  };
}

/**
 * 🆕 Configura las transiciones CSS del contenedor para efectos suaves
 */
function setupContainerTransitions(target) {
  // Agregar estilos CSS inline para transiciones suaves
  if (target && target.style) {
    // Transición suave para la altura y opacidad
    target.style.transition =
      'max-height 0.4s ease-out, opacity 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out';
    target.style.overflow = 'hidden';
  }
}

/**
 * Obtiene y valida los elementos del DOM necesarios
 */
function getElements(buttonId, config) {
  const button = document.getElementById(buttonId);
  if (!button) {
    if (typeof console !== 'undefined') {
      console.warn(`Botón con ID "${buttonId}" no encontrado`);
    }
    return null;
  }

  const target = document.getElementById(config.targetId);
  if (!target) {
    if (typeof console !== 'undefined') {
      console.warn(`Contenedor con ID "${config.targetId}" no encontrado`);
    }
    return null;
  }

  const grid = target.querySelector('.grid');
  if (!grid) {
    if (typeof console !== 'undefined') {
      console.warn(
        'Grid con clase ".grid" no encontrado dentro del contenedor'
      );
    }
    return null;
  }

  return { button, target, grid };
}

/**
 * Configura el estado inicial de las tarjetas y el botón
 */
function initializeCards(button, grid, hiddenClass, chunkSize, state) {
  const cards = Array.from(grid.children);
  const totalCards = cards.length;

  // Actualizar estado
  state.currentCardCount = totalCards;

  if (totalCards === 0) {
    button.style.display = 'none';
    return;
  }

  button.style.display = '';

  // Configurar texto inicial del botón usando los textos del componente
  const { showAllText } = getLocalizedStrings(button, totalCards);
  button.textContent = showAllText.replace('${total}', totalCards);

  // Ocultar todas las tarjetas si el contenedor está oculto
  const target = grid.closest(`[id]`);
  if (target?.classList.contains(hiddenClass)) {
    cards.forEach((card) => card.classList.add(hiddenClass));
  }
}

/**
 * Configura el listener del botón principal
 */
function setupButtonListener(button, target, grid, config, state) {
  button.addEventListener('click', async () => {
    const cards = Array.from(grid.children);
    const revealedCount = getRevealedCount(cards, config.hiddenClass);
    const totalCards = cards.length;
    const remaining = totalCards - revealedCount;

    // Actualizar estado si cambió el número de tarjetas
    if (totalCards !== state.currentCardCount) {
      updateCardsState(button, grid, config, state);
      return; // Reintentar con nuevo estado
    }

    // Si no quedan tarjetas por mostrar, colapsar todo
    if (remaining <= 0) {
      collapseAll(button, target, cards, config, state);
      return;
    }

    // Mostrar contenedor si está oculto
    showContainer(button, target, config.hiddenClass);
    state.isCollapsed = false;

    // Ocultar todas las tarjetas inicialmente si ninguna está visible
    if (revealedCount === 0) {
      cards.forEach((card) => card.classList.add(config.hiddenClass));
    }

    // Revelar siguiente grupo de tarjetas (esperar a que terminen las animaciones)
    const revealed = await revealNextCards(cards, config, target);

    // Actualizar texto del botón
    updateButtonText(
      button,
      totalCards,
      revealedCount + revealed,
      config.chunkSize
    );

    // Ejecutar callback si existe
    if (typeof config.onShow === 'function') {
      config.onShow();
    }
  });
}

/**
 * Cuenta las tarjetas actualmente visibles
 */
function getRevealedCount(cards, hiddenClass) {
  return cards.filter((card) => !card.classList.contains(hiddenClass)).length;
}

/**
 * 🆕 Muestra el contenedor principal si está oculto con transición suave
 */
function showContainer(button, target, hiddenClass) {
  if (target.classList.contains(hiddenClass)) {
    // Preparar para mostrar con altura automática
    target.style.maxHeight = 'none';
    target.style.opacity = '1';
    target.classList.remove(hiddenClass);
    button.setAttribute('aria-expanded', 'true');
  }
}

/**
 * Revela el siguiente grupo de tarjetas
 */
function revealNextCards(cards, config, target) {
  return new Promise((resolve) => {
    const hiddenCards = cards.filter((card) =>
      card.classList.contains(config.hiddenClass)
    );
    const toShow = Math.min(config.chunkSize, hiddenCards.length);

    if (toShow === 0) {
      resolve(0);
      return;
    }

    const revealedCards = [];

    // Mostrar y preparar promesas por tarjeta
    for (const card of hiddenCards) {
      if (revealedCards.length >= toShow) break;
      card.classList.remove(config.hiddenClass);
      revealedCards.push(card);

      // Inicializar slider si existe en la tarjeta
      initializeSliderIfExists(card);
    }

    // Expandir contenedor suavemente antes de esperar a las animaciones de cards
    try {
      expandContainerSmoothly(target);
    } catch {
      // noop
    }

    // Crear promesas que se resuelven al terminar la animación o tras fallback
    const promises = revealedCards.map((card) => {
      return new Promise((res) => {
        try {
          if (!card.classList.contains('animate-expand-vertically')) {
            card.classList.add('animate-expand-vertically');
          }

          const onEnd = () => {
            card.removeEventListener('animationend', onEnd);
            // limpiar la clase para evitar acumulación
            card.classList.remove('animate-expand-vertically');
            res();
          };

          // Timeout fallback (un poco mayor que 1000ms)
          const to = setTimeout(() => {
            card.removeEventListener('animationend', onEnd);
            card.classList.remove('animate-expand-vertically');
            res();
          }, 1100);

          const wrapped = () => {
            clearTimeout(to);
            onEnd();
          };

          card.addEventListener('animationend', wrapped);
        } catch {
          res();
        }
      });
    });

    Promise.all(promises).then(() => {
      resolve(revealedCards.length);
    });
  });
}

/**
 * 🆕 Colapsa todas las tarjetas y resetea el estado con transición suave
 */
function collapseAll(button, target, cards, config, state) {
  // Esperar a que todas las animaciones de contracción terminen antes de ocultar
  const visibleCards = cards.filter(
    (c) => !c.classList.contains(config.hiddenClass)
  );

  if (visibleCards.length === 0) {
    // No hay visibles: ocultar con transición suave
    hideContainerSmoothly(button, target, config, state, cards.length);
    return;
  }

  const promises = visibleCards.map((card) => {
    return new Promise((resolve) => {
      try {
        // Añadir clase de animación (idempotente)
        if (!card.classList.contains('animate-contract-vertically')) {
          card.classList.add('animate-contract-vertically');
        }

        // Handler que limpia y resuelve (NO ocultar todavía para evitar salto)
        const wrappedDone = () => {
          card.removeEventListener('animationend', wrappedDone);
          card.classList.remove('animate-contract-vertically');
          clearTimeout(timeout);
          resolve();
        };

        // Timeout fallback
        const timeout = setTimeout(() => {
          card.removeEventListener('animationend', wrappedDone);
          card.classList.remove('animate-contract-vertically');
          resolve();
        }, 1000); // un poco más que la duración de 500ms

        card.addEventListener('animationend', wrappedDone);
      } catch {
        resolve();
      }
    });
  });

  // 🆕 Cuando todas las tarjetas han terminado de contraerse, ocultar contenedor suavemente
  Promise.all(promises).then(() => {
    // hideContainerSmoothly ahora devuelve una Promise
    hideContainerSmoothly(button, target, config, state, cards.length).then(
      () => {
        // Finalmente ocultar las tarjetas (ya que el contenedor terminó su transición)
        visibleCards.forEach((card) => {
          try {
            if (!card.classList.contains(config.hiddenClass)) {
              card.classList.add(config.hiddenClass);
            }
          } catch {
            // noop
          }
        });
      }
    );
  });
}

/**
 * 🆕 Oculta el contenedor con una transición suave
 */
function hideContainerSmoothly(button, target, config, state, totalCards) {
  // Obtener altura actual para la transición
  const currentHeight = target.scrollHeight;

  // Establecer altura actual explícitamente
  target.style.maxHeight = currentHeight + 'px';

  // Forzar reflow para que la altura se aplique
  void target.offsetHeight;

  // Comenzar transición hacia altura 0 y opacidad 0
  (
    window.requestAnimationFrame ||
    function (fn) {
      return setTimeout(fn, 16);
    }
  )(() => {
    target.style.maxHeight = '0px';
    target.style.opacity = '0';
    target.style.paddingTop = '0px';
    target.style.paddingBottom = '0px';
    target.style.marginTop = '0px';
    target.style.marginBottom = '0px';
  });

  // Después del delay, ocultar completamente y resetear estilos
  setTimeout(() => {
    target.classList.add(config.hiddenClass);
    button.setAttribute('aria-expanded', 'false');
    state.isCollapsed = true;

    // Resetear estilos para la próxima vez
    target.style.maxHeight = '';
    target.style.opacity = '';
    target.style.paddingTop = '';
    target.style.paddingBottom = '';
    target.style.marginTop = '';
    target.style.marginBottom = '';

    // Actualizar texto del botón
    const { showAllText } = getLocalizedStrings(button, totalCards);
    button.textContent = showAllText.replace('${total}', totalCards);

    // Ejecutar callback si existe
    if (typeof config.onHide === 'function') {
      config.onHide();
    }
  }, config.containerTransitionDelay + 200); // Un poco más tiempo que la transición CSS
}

/**
 * 🆕 Expande el contenedor con una transición suave (para evitar salto del botón)
 */
function expandContainerSmoothly(target) {
  if (!target || !target.style) return;

  // Asegurar overflow hidden y transición ya seteada en setupContainerTransitions
  target.style.overflow = 'hidden';

  // Medir altura necesaria
  const targetHeight = target.scrollHeight;

  // Empezar desde 0 si está oculto
  target.style.maxHeight = '0px';
  target.style.opacity = '0';

  // Forzar reflow
  void target.offsetHeight;

  // Remover hidden para que el contenido sea accesible
  target.classList.remove('hidden');

  // Animar hacia la altura completa
  (
    window.requestAnimationFrame ||
    function (fn) {
      return setTimeout(fn, 16);
    }
  )(() => {
    target.style.maxHeight = targetHeight + 'px';
    target.style.opacity = '1';
    // restaurar posibles paddings/margins por defecto (vacío permite CSS controlar)
    target.style.paddingTop = '';
    target.style.paddingBottom = '';
    target.style.marginTop = '';
    target.style.marginBottom = '';
  });

  // Limpiar el maxHeight después de la transición para permitir auto height
  setTimeout(() => {
    target.style.maxHeight = '';
    target.style.overflow = '';
  }, 450);
}

/**
 * Actualiza el texto del botón según el estado actual
 */
function updateButtonText(button, total, revealed) {
  const remaining = total - revealed;
  const { showAllText, hideText } = getLocalizedStrings(button, total);

  if (remaining > 0) {
    button.textContent = showAllText.replace('${total}', total);
  } else {
    button.textContent = hideText;
  }
}

/**
 * Obtiene los textos localizados para el botón (showAll / hide)
 * Prioriza atributos data-* del propio botón, luego window.TRANSLATIONS según el lang actual.
 */
function getLocalizedStrings(button, total) {
  const lang =
    document.documentElement.lang ||
    (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
      ? window.localStorage.getItem('lang')
      : null) ||
    'ES';

  const dsShow = button.dataset.showAllText;
  const dsHide = button.dataset.hideText;

  let showAll = dsShow || null;
  let hide = dsHide || null;

  try {
    if (
      window &&
      window.TRANSLATIONS &&
      window.TRANSLATIONS[lang] &&
      window.TRANSLATIONS[lang].showMore
    ) {
      const sm = window.TRANSLATIONS[lang].showMore;
      if (!showAll && sm.showAll) showAll = sm.showAll;
      if (!hide && sm.hide) hide = sm.hide;
    }
  } catch {
    // noop
  }

  // Fallbacks básicos por idioma
  if (!showAll)
    showAll = lang === 'EN' ? `Show all (${total})` : `Ver todos (${total})`;
  if (!hide) hide = lang === 'EN' ? 'Hide' : 'Ocultar';

  return { showAllText: showAll, hideText: hide };
}

/**
 * Inicializa slider dentro de una tarjeta si existe
 */
function initializeSliderIfExists(card) {
  const slider = card.querySelector('[id^="slider-"]');
  if (!slider) return;

  // Evitar reinicialización
  if (slider.dataset.sliderInitialized === 'true') return;

  // Si ya existe la función global, usarla
  if (window.initSlider) {
    initSlider(slider);
    return;
  }

  // Cargar módulo del slider si no existe
  loadSliderModule(slider);
}

/**
 * Inicializa un slider específico
 */
function initSlider(sliderElement) {
  try {
    if (typeof window !== 'undefined' && window.initSlider) {
      window.initSlider(sliderElement.id || sliderElement);
      sliderElement.dataset.sliderInitialized = 'true';
    }
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.warn('Error al inicializar slider:', error);
    }
  }
}

/**
 * Carga el módulo del slider dinámicamente
 */
function loadSliderModule(sliderElement) {
  // Evitar múltiples cargas del script
  const existingScript = document.querySelector('script[data-slider-module]');
  if (existingScript) {
    existingScript.addEventListener('load', () => {
      if (window.initSlider) initSlider(sliderElement);
    });
    return;
  }

  // Crear y cargar script del slider
  const script = document.createElement('script');
  script.type = 'module';
  script.src = '/js/slider/slider-client.js';
  script.setAttribute('data-slider-module', '');

  script.addEventListener('load', () => {
    if (window.initSlider) initSlider(sliderElement);
  });

  script.addEventListener('error', () => {
    if (typeof console !== 'undefined') {
      console.warn('Error al cargar el módulo del slider');
    }
  });

  document.head.appendChild(script);
}

// Exponer función globalmente para uso sin bundler
if (typeof window !== 'undefined') {
  window.initShowMore = initShowMore;
}

/**
 * 📄 DETECCIÓN AUTOMÁTICA DE CAMBIOS EN TARJETAS
 * Observa automáticamente cuando se agregan/quitan tarjetas del grid
 */
function setupCardObserver(button, grid, config, state) {
  // Verificar soporte para MutationObserver
  if (typeof MutationObserver === 'undefined') {
    if (typeof console !== 'undefined') {
      console.warn('MutationObserver no soportado en este navegador');
    }
    return null;
  }

  let timeoutId;

  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;

    mutations.forEach((mutation) => {
      // Detectar si se agregaron o removieron nodos hijos (tarjetas)
      if (
        mutation.type === 'childList' &&
        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
      ) {
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      // Usar timeout para evitar múltiples actualizaciones rápidas
      if (typeof clearTimeout !== 'undefined') {
        clearTimeout(timeoutId);
      }

      if (typeof setTimeout !== 'undefined') {
        timeoutId = setTimeout(() => {
          updateCardsState(button, grid, config, state);
        }, config.observerDelay);
      } else {
        // Fallback sin setTimeout
        updateCardsState(button, grid, config, state);
      }
    }
  });

  // Observar cambios en los hijos directos del grid (tarjetas)
  observer.observe(grid, {
    childList: true, // Detectar agregar/quitar hijos
    subtree: false, // Solo nivel directo, no subniveles
  });

  return observer;
}

/**
 * Actualiza el estado cuando cambia el número de tarjetas
 */
function updateCardsState(button, grid, config, state) {
  const cards = Array.from(grid.children);
  const newCount = cards.length;
  const oldCount = state.currentCardCount;

  if (typeof console !== 'undefined') {
    console.log(`📄 Tarjetas detectadas: ${oldCount} → ${newCount}`);
  }

  // Actualizar estado
  state.currentCardCount = newCount;

  // Si no hay tarjetas, ocultar botón
  if (newCount === 0) {
    button.style.display = 'none';
    return;
  }

  // Mostrar botón si estaba oculto
  button.style.display = '';

  // Resetear estado visual según configuración actual
  if (state.isCollapsed) {
    // Si estaba colapsado, mantener colapsado pero actualizar texto
    cards.forEach((card) => card.classList.add(config.hiddenClass));
    const { showAllText } = getLocalizedStrings(button, newCount);
    button.textContent = showAllText.replace('${total}', newCount);
  } else {
    // Si estaba expandido, mantener tarjetas visibles pero actualizar texto
    const revealedCount = getRevealedCount(cards, config.hiddenClass);
    updateButtonText(button, newCount, revealedCount);
  }

  // Ejecutar callback si existe
  if (typeof config.onCardsChanged === 'function') {
    config.onCardsChanged(newCount, oldCount);
  }
}

/**
 * Función para actualización manual (sin observador automático)
 */
function updateCardsManually(button, grid, config, state) {
  updateCardsState(button, grid, config, state);
}
