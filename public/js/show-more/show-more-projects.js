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
    containerTransitionDelay: 400, // 🆕 Delay antes de ocultar el contenedor
    onShow: null,
    onHide: null,
    onCardsChanged: null,
    ...options,
  };

  // Validar elementos del DOM
  const elements = getElements(buttonId, config);
  if (!elements) return;

  const { button, target, grid } = elements;

  // 🆕 Agregar clase CSS para transiciones suaves al contenedor
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
  if (target && target.classList) {
    target.classList.add('show-more-projects-container');
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

    for (const card of hiddenCards) {
      if (revealedCards.length >= toShow) break;
      card.classList.remove(config.hiddenClass);
      revealedCards.push(card);

      // Inicializar slider si existe en la tarjeta
      initializeSliderIfExists(card);
    }

    try {
      expandContainerSmoothly(target, config.hiddenClass);
    } catch {
      // noop
    }

    const promises = revealedCards.map((card) => {
      return new Promise((res) => {
        try {
          if (!card.classList.contains('animate-expand-vertically')) {
            card.classList.add('animate-expand-vertically');
          }

          const onEnd = () => {
            card.removeEventListener('animationend', onEnd);
            card.classList.remove('animate-expand-vertically');
            res();
          };

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
  const visibleCards = cards.filter(
    (c) => !c.classList.contains(config.hiddenClass)
  );

  if (visibleCards.length === 0) {
    hideContainerSmoothly(
      button,
      target,
      config,
      state,
      cards.length,
      []
    ).catch(() => {});
    return;
  }

  const promises = visibleCards.map((card) => {
    return new Promise((resolve) => {
      try {
        if (!card.classList.contains('animate-contract-vertically')) {
          card.classList.add('animate-contract-vertically');
        }

        const wrappedDone = () => {
          card.removeEventListener('animationend', wrappedDone);
          card.classList.remove('animate-contract-vertically');
          clearTimeout(timeout);
          resolve();
        };

        const timeout = setTimeout(() => {
          card.removeEventListener('animationend', wrappedDone);
          card.classList.remove('animate-contract-vertically');
          resolve();
        }, 1000);

        card.addEventListener('animationend', wrappedDone);
      } catch {
        resolve();
      }
    });
  });

  Promise.all(promises).then(() => {
    hideContainerSmoothly(
      button,
      target,
      config,
      state,
      cards.length,
      visibleCards
    ).catch(() => {});
  });
}

/**
 * 🆕 Oculta el contenedor con una transición suave
 */
function hideContainerSmoothly(
  button,
  target,
  config,
  state,
  totalCards,
  visibleCards = []
) {
  return new Promise((resolve) => {
    const currentHeight = target.scrollHeight;
    target.style.maxHeight = currentHeight + 'px';
    void target.offsetHeight;

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

    setTimeout(() => {
      target.classList.add(config.hiddenClass);
      button.setAttribute('aria-expanded', 'false');
      state.isCollapsed = true;

      target.style.maxHeight = '';
      target.style.opacity = '';
      target.style.paddingTop = '';
      target.style.paddingBottom = '';
      target.style.marginTop = '';
      target.style.marginBottom = '';

      try {
        if (Array.isArray(visibleCards) && visibleCards.length > 0) {
          visibleCards.forEach((card) => {
            if (!card.classList.contains(config.hiddenClass)) {
              card.classList.add(config.hiddenClass);
            }
          });
        }
      } catch {
        // noop
      }

      const { showAllText } = getLocalizedStrings(button, totalCards);
      button.textContent = showAllText.replace('${total}', totalCards);

      if (typeof config.onHide === 'function') {
        config.onHide();
      }

      resolve();
    }, config.containerTransitionDelay + 200);
  });
}

/**
 * 🆕 Expande el contenedor con una transición suave (para evitar salto del botón)
 */
function expandContainerSmoothly(target, hiddenClass = 'hidden') {
  if (!target || !target.style) return;

  target.style.overflow = 'hidden';
  const targetHeight = target.scrollHeight;

  target.style.maxHeight = '0px';
  target.style.opacity = '0';
  void target.offsetHeight;

  target.classList.remove(hiddenClass);

  (
    window.requestAnimationFrame ||
    function (fn) {
      return setTimeout(fn, 16);
    }
  )(() => {
    target.style.maxHeight = targetHeight + 'px';
    target.style.opacity = '1';
    target.style.paddingTop = '';
    target.style.paddingBottom = '';
    target.style.marginTop = '';
    target.style.marginBottom = '';
  });

  setTimeout(() => {
    target.style.maxHeight = '';
    target.style.overflow = '';
  }, 650);
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
 * Obtiene los textos localizados para el botón
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

  if (slider.dataset.sliderInitialized === 'true') return;

  if (window.initSlider) {
    initSlider(slider);
    return;
  }

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
  const existingScript = document.querySelector('script[data-slider-module]');
  if (existingScript) {
    existingScript.addEventListener('load', () => {
      if (window.initSlider) initSlider(sliderElement);
    });
    return;
  }

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

// Exponer función globalmente
if (typeof window !== 'undefined') {
  window.initShowMore = initShowMore;
}

/**
 * 📄 DETECCIÓN AUTOMÁTICA DE CAMBIOS EN TARJETAS
 */
function setupCardObserver(button, grid, config, state) {
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
      if (
        mutation.type === 'childList' &&
        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
      ) {
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      if (typeof clearTimeout !== 'undefined') {
        clearTimeout(timeoutId);
      }

      if (typeof setTimeout !== 'undefined') {
        timeoutId = setTimeout(() => {
          updateCardsState(button, grid, config, state);
        }, config.observerDelay);
      } else {
        updateCardsState(button, grid, config, state);
      }
    }
  });

  observer.observe(grid, {
    childList: true,
    subtree: false,
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

  state.currentCardCount = newCount;

  if (newCount === 0) {
    button.style.display = 'none';
    return;
  }

  button.style.display = '';

  if (state.isCollapsed) {
    cards.forEach((card) => card.classList.add(config.hiddenClass));
    const { showAllText } = getLocalizedStrings(button, newCount);
    button.textContent = showAllText.replace('${total}', newCount);
  } else {
    const revealedCount = getRevealedCount(cards, config.hiddenClass);
    updateButtonText(button, newCount, revealedCount);
  }

  if (typeof config.onCardsChanged === 'function') {
    config.onCardsChanged(newCount, oldCount);
  }
}

/**
 * Función para actualización manual
 */
function updateCardsManually(button, grid, config, state) {
  updateCardsState(button, grid, config, state);
}
