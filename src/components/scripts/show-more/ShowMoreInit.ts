import type {
  ShowMoreOptions,
  ShowMoreAPI,
  ShowMoreConfig,
  ShowMoreState,
} from './types';
import {
  setupContainerTransitions,
  getElements,
  initializeCards,
  setupButtonListener,
  setupCardObserver,
  updateCardsState,
  updateCardsManually,
  getRevealedCount,
} from './showMoreCore';

// Función principal de inicialización
export default function initShowMore(
  buttonId: string = 'show-more-projects',
  options: ShowMoreOptions = {}
): ShowMoreAPI | undefined {
  // Configuración por defecto
  const config: ShowMoreConfig = {
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

  // Obtener elementos del DOM
  const elements = getElements(buttonId, config);
  if (!elements) return;

  const { button, target, grid } = elements;

  // Configurar el atributo data-target en el botón para referencia
  button.setAttribute('data-target', config.targetId);

  // Configurar transiciones del contenedor
  setupContainerTransitions(target);

  // Estado inicial
  const state: ShowMoreState = {
    currentCardCount: 0,
    isCollapsed: true,
  };

  // Inicializar componentes
  initializeCards(button, grid, config.hiddenClass, config.chunkSize, state);
  setupButtonListener(button, target, grid, config, state);

  // Configurar auto-actualización si está habilitada
  if (config.autoUpdate) {
    setupCardObserver(button, grid, config, state);
  }

  // Event listener para cambios de idioma
  if (typeof window !== 'undefined') {
    window.addEventListener('langChange', () => {
      updateCardsState(button, grid, config, state);
    });
  }

  // API pública
  return {
    updateCards: () => updateCardsManually(button, grid, config, state),
    getCurrentCount: () => Array.from(grid.children).length,
    getRevealedCount: () =>
      getRevealedCount(
        Array.from(grid.children) as HTMLElement[],
        config.hiddenClass
      ),
  };
}

// Exponer globalmente para uso sin bundler
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).initShowMore = initShowMore;
}
