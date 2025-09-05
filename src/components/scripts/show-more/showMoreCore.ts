import type {
  ShowMoreConfig,
  ShowMoreState,
  ShowMoreElements,
  LocalizedStrings,
  AnimationPromise,
} from './types';

// Configurar transiciones del contenedor
export function setupContainerTransitions(target: HTMLElement): void {
  if (target && target.classList) {
    target.classList.add('show-more-projects-container');
  }
}

// Obtener elementos del DOM
export function getElements(
  buttonId: string,
  config: ShowMoreConfig
): ShowMoreElements | null {
  const button = document.getElementById(buttonId);
  const target = document.getElementById(config.targetId);
  const grid = target?.querySelector('.grid') as HTMLElement;

  if (!button || !target || !grid) return null;

  return { button, target, grid };
}

// Inicializar tarjetas
export function initializeCards(
  button: HTMLElement,
  grid: HTMLElement,
  hiddenClass: string,
  chunkSize: number,
  state: ShowMoreState
): void {
  const cards = Array.from(grid.children) as HTMLElement[];
  const totalCards = cards.length;

  // Actualizar estado
  state.currentCardCount = totalCards;

  if (totalCards === 0) {
    button.style.display = 'none';
    return;
  }

  button.style.display = '';

  // Contar solo las tarjetas que YA están marcadas como ocultas desde el servidor
  const hiddenCards = cards.filter((card) =>
    card.classList.contains(hiddenClass)
  );
  const hiddenCount = hiddenCards.length;

  console.log(
    `🔢 Tarjetas ocultas desde servidor: ${hiddenCount} de ${totalCards} totales`
  );

  // El botón ya debe tener el número correcto desde el servidor,
  // pero lo actualizamos para asegurar consistencia
  const { showAllText } = getLocalizedStrings(button, hiddenCount);
  setButtonText(
    button,
    showAllText.replace('${total}', hiddenCount.toString())
  );
}

// Configurar event listener del botón
export function setupButtonListener(
  button: HTMLElement,
  target: HTMLElement,
  grid: HTMLElement,
  config: ShowMoreConfig,
  state: ShowMoreState
): void {
  button.addEventListener('click', async () => {
    const cards = Array.from(grid.children) as HTMLElement[];
    const revealedCount = getRevealedCount(cards, config.hiddenClass);
    const hiddenCount = getHiddenCount(cards, config.hiddenClass);
    const totalCards = cards.length;

    // Actualizar estado si cambió el número de tarjetas
    if (totalCards !== state.currentCardCount) {
      updateCardsState(button, grid, config, state);
      return; // Reintentar con nuevo estado
    }

    // Si no quedan tarjetas ocultas por mostrar, colapsar todo
    if (hiddenCount <= 0) {
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

    // Actualizar texto del botón basado en tarjetas ocultas restantes
    updateButtonText(button, totalCards, revealedCount + revealed);

    // Ejecutar callback si existe
    if (typeof config.onShow === 'function') {
      config.onShow();
    }
  });
}

// Obtener cantidad de tarjetas reveladas
export function getRevealedCount(
  cards: HTMLElement[],
  hiddenClass: string
): number {
  return cards.filter((card) => !card.classList.contains(hiddenClass)).length;
}

// Obtener cantidad de tarjetas ocultas
export function getHiddenCount(
  cards: HTMLElement[],
  hiddenClass: string
): number {
  return cards.filter((card) => card.classList.contains(hiddenClass)).length;
}

// Mostrar contenedor
export function showContainer(
  button: HTMLElement,
  target: HTMLElement,
  hiddenClass: string
): void {
  if (target.classList.contains(hiddenClass)) {
    target.style.maxHeight = 'none';
    target.style.opacity = '1';
    target.classList.remove(hiddenClass);
    button.setAttribute('aria-expanded', 'true');
  }
}

// Revelar siguientes tarjetas
export function revealNextCards(
  cards: HTMLElement[],
  config: ShowMoreConfig,
  target: HTMLElement
): Promise<number> {
  return new Promise((resolve) => {
    const hiddenCards = cards.filter((card) =>
      card.classList.contains(config.hiddenClass)
    );
    const toShow = Math.min(config.chunkSize, hiddenCards.length);

    if (toShow === 0) {
      resolve(0);
      return;
    }

    const revealedCards: HTMLElement[] = [];

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

    const promises = revealedCards.map((card): AnimationPromise => {
      return new Promise<void>((res) => {
        try {
          if (!card.classList.contains('animate-expand-vertically')) {
            card.classList.add('animate-expand-vertically');
          }

          const onEnd = (): void => {
            card.removeEventListener('animationend', onEnd);
            card.classList.remove('animate-expand-vertically');
            res();
          };

          const timeout = setTimeout(() => {
            card.removeEventListener('animationend', onEnd);
            card.classList.remove('animate-expand-vertically');
            res();
          }, 1100);

          const wrapped = (): void => {
            clearTimeout(timeout);
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

// Colapsar todas las tarjetas
export function collapseAll(
  button: HTMLElement,
  target: HTMLElement,
  cards: HTMLElement[],
  config: ShowMoreConfig,
  state: ShowMoreState
): void {
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

  const promises = visibleCards.map((card): AnimationPromise => {
    return new Promise<void>((resolve) => {
      try {
        if (!card.classList.contains('animate-contract-vertically')) {
          card.classList.add('animate-contract-vertically');
        }

        const wrappedDone = (): void => {
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

// Ocultar contenedor suavemente
export function hideContainerSmoothly(
  button: HTMLElement,
  target: HTMLElement,
  config: ShowMoreConfig,
  state: ShowMoreState,
  totalCards: number,
  visibleCards: HTMLElement[] = []
): Promise<void> {
  return new Promise<void>((resolve) => {
    const currentHeight = target.scrollHeight;
    target.style.maxHeight = currentHeight + 'px';
    void target.offsetHeight;

    (
      window.requestAnimationFrame ||
      function (fn: FrameRequestCallback) {
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

      // Contar tarjetas ocultas dinámicamente después de ocultar
      const allCards = Array.from(
        target.querySelectorAll('.grid > *')
      ) as HTMLElement[];
      const hiddenCount = getHiddenCount(allCards, config.hiddenClass);
      const { showAllText } = getLocalizedStrings(button, hiddenCount);
      setButtonText(
        button,
        showAllText.replace('${total}', hiddenCount.toString())
      );

      if (typeof config.onHide === 'function') {
        config.onHide();
      }

      resolve();
    }, config.containerTransitionDelay + 200);
  });
}

// Expandir contenedor suavemente
export function expandContainerSmoothly(
  target: HTMLElement,
  hiddenClass: string = 'hidden'
): void {
  if (!target || !target.style) return;

  target.style.overflow = 'hidden';
  const targetHeight = target.scrollHeight;

  target.style.maxHeight = '0px';
  target.style.opacity = '0';
  void target.offsetHeight;

  target.classList.remove(hiddenClass);

  (
    window.requestAnimationFrame ||
    function (fn: FrameRequestCallback) {
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

// Actualizar texto del botón
export function updateButtonText(
  button: HTMLElement,
  total: number,
  revealed: number
): void {
  // Intentar encontrar el grid asociado para contar dinámicamente
  let hiddenCount = total - revealed; // fallback

  try {
    // Buscar el contenedor del grid relacionado
    const targetId = button.getAttribute('data-target') || 'extra-projects';
    const target = document.getElementById(targetId);
    const grid = target?.querySelector('.grid');

    if (grid) {
      const cards = Array.from(grid.children) as HTMLElement[];
      hiddenCount = getHiddenCount(cards, 'hidden');
    }
  } catch {
    // usar fallback si hay error
  }

  const { showAllText, hideText } = getLocalizedStrings(button, hiddenCount);

  if (hiddenCount > 0) {
    setButtonText(
      button,
      showAllText.replace('${total}', hiddenCount.toString())
    );
  } else {
    setButtonText(button, hideText);
  }
}

// Obtener strings localizados
export function getLocalizedStrings(
  button: HTMLElement,
  total: number
): LocalizedStrings {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithTranslations = window as any;
    if (
      windowWithTranslations &&
      windowWithTranslations.TRANSLATIONS &&
      windowWithTranslations.TRANSLATIONS[lang] &&
      windowWithTranslations.TRANSLATIONS[lang].showMore
    ) {
      const sm = windowWithTranslations.TRANSLATIONS[lang].showMore;
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

// Preservar marcado interno del botón al actualizar texto (ej. spans/iconos)
export function setButtonText(button: HTMLElement, text: string): void {
  try {
    const textSpan = button.querySelector(
      '.neon-showmore-btn__text'
    ) as HTMLElement;
    if (textSpan) {
      textSpan.textContent = text;
      return;
    }
  } catch {
    // noop
  }

  try {
    button.textContent = text;
  } catch {
    // noop
  }
}

// Inicializar slider si existe
export function initializeSliderIfExists(card: HTMLElement): void {
  const slider = card.querySelector('[id^="slider-"]') as HTMLElement;
  if (!slider) return;
  // Si el slider expuso API de refresco, la usamos
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sliders = (window as any).__projectSliders;
    if (
      sliders &&
      sliders[slider.id] &&
      typeof sliders[slider.id].refresh === 'function'
    ) {
      sliders[slider.id].refresh();
      return;
    }
  } catch {
    /* noop */
  }

  // Fallback: disparar evento para que el propio slider se refresque
  try {
    slider.dispatchEvent(new CustomEvent('slider:refresh', { bubbles: false }));
  } catch {
    /* noop */
  }
}

// Configurar observer de tarjetas
export function setupCardObserver(
  button: HTMLElement,
  grid: HTMLElement,
  config: ShowMoreConfig,
  state: ShowMoreState
): MutationObserver | null {
  if (typeof MutationObserver === 'undefined') {
    if (typeof console !== 'undefined') {
      console.warn('MutationObserver no soportado en este navegador');
    }
    return null;
  }

  let timeoutId: number;

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
        timeoutId = window.setTimeout(() => {
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

// Actualizar estado de las tarjetas
export function updateCardsState(
  button: HTMLElement,
  grid: HTMLElement,
  config: ShowMoreConfig,
  state: ShowMoreState
): void {
  const cards = Array.from(grid.children) as HTMLElement[];
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
    const hiddenCount = getHiddenCount(cards, config.hiddenClass);
    const { showAllText } = getLocalizedStrings(button, hiddenCount);
    setButtonText(
      button,
      showAllText.replace('${total}', hiddenCount.toString())
    );
  } else {
    const revealedCount = getRevealedCount(cards, config.hiddenClass);
    updateButtonText(button, newCount, revealedCount);
  }

  if (typeof config.onCardsChanged === 'function') {
    config.onCardsChanged(newCount, oldCount);
  }
}

// Actualizar tarjetas manualmente
export function updateCardsManually(
  button: HTMLElement,
  grid: HTMLElement,
  config: ShowMoreConfig,
  state: ShowMoreState
): void {
  updateCardsState(button, grid, config, state);
}
