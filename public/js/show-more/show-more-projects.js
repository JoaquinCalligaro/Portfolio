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
    onShow: null,
    onHide: null,
    onCardsChanged: null,
    ...options,
  };

  // Validar elementos del DOM
  const elements = getElements(buttonId, config);
  if (!elements) return;

  const { button, target, grid } = elements;

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
  button.addEventListener('click', () => {
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

    // Revelar siguiente grupo de tarjetas
    const revealed = revealNextCards(cards, config);

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
 * Muestra el contenedor principal si está oculto
 */
function showContainer(button, target, hiddenClass) {
  if (target.classList.contains(hiddenClass)) {
    target.classList.remove(hiddenClass);
    button.setAttribute('aria-expanded', 'true');
  }
}

/**
 * Revela el siguiente grupo de tarjetas
 */
function revealNextCards(cards, config) {
  const toShow = Math.min(
    config.chunkSize,
    cards.filter((card) => card.classList.contains(config.hiddenClass)).length
  );

  let revealed = 0;

  for (const card of cards) {
    if (revealed >= toShow) break;

    if (card.classList.contains(config.hiddenClass)) {
      card.classList.remove(config.hiddenClass);
      revealed++;

      // Inicializar slider si existe en la tarjeta
      initializeSliderIfExists(card);
    }
  }

  return revealed;
}

/**
 * Colapsa todas las tarjetas y resetea el estado
 */
function collapseAll(button, target, cards, config, state) {
  cards.forEach((card) => card.classList.add(config.hiddenClass));
  target.classList.add(config.hiddenClass);
  button.setAttribute('aria-expanded', 'false');

  state.isCollapsed = true;

  // Resetear texto del botón
  const { showAllText } = getLocalizedStrings(button, cards.length);
  button.textContent = showAllText.replace('${total}', cards.length);

  // Ejecutar callback si existe
  if (typeof config.onHide === 'function') {
    config.onHide();
  }
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
 * 🔄 DETECCIÓN AUTOMÁTICA DE CAMBIOS EN TARJETAS
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
    console.log(`🔄 Tarjetas detectadas: ${oldCount} → ${newCount}`);
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
