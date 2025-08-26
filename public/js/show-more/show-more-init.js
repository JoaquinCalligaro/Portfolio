/* eslint-env browser */
/* global window */
// show-more-init.js
//  Punto de entrada: importa la lógica core y expone initShowMore()
// Separa configuración, inicialización y estado

import {
  setupContainerTransitions,
  getElements,
  initializeCards,
  setupButtonListener,
  setupCardObserver,
  updateCardsState,
  updateCardsManually,
  getRevealedCount,
} from './show-more-core.js';

export default function initShowMore(
  buttonId = 'show-more-projects',
  options = {}
) {
  const config = {
    targetId: 'extra-projects',
    hiddenClass: 'hidden',
    chunkSize: 999,
    autoUpdate: true,
    observerDelay: 100,
    containerTransitionDelay: 400,
    onShow: null,
    onHide: null,
    onCardsChanged: null,
    ...options,
  };

  const elements = getElements(buttonId, config);
  if (!elements) return;
  const { button, target, grid } = elements;

  setupContainerTransitions(target);

  const state = { currentCardCount: 0, isCollapsed: true };

  initializeCards(button, grid, config.hiddenClass, config.chunkSize, state);
  setupButtonListener(button, target, grid, config, state);

  if (config.autoUpdate) {
    setupCardObserver(button, grid, config, state);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('langChange', () => {
      updateCardsState(button, grid, config, state);
    });
  }

  return {
    updateCards: () => updateCardsManually(button, grid, config, state),
    getCurrentCount: () => Array.from(grid.children).length,
    getRevealedCount: () =>
      getRevealedCount(Array.from(grid.children), config.hiddenClass),
  };
}

if (typeof window !== 'undefined') {
  window.initShowMore = initShowMore;
}
