// Definiciones de tipos para el sistema show-more

export interface ShowMoreConfig {
  targetId: string;
  hiddenClass: string;
  chunkSize: number;
  autoUpdate: boolean;
  observerDelay: number;
  containerTransitionDelay: number;
  onShow?: (() => void) | null;
  onHide?: (() => void) | null;
  onCardsChanged?: ((newCount: number, oldCount: number) => void) | null;
}

export interface ShowMoreState {
  currentCardCount: number;
  isCollapsed: boolean;
}

export interface ShowMoreElements {
  button: HTMLElement;
  target: HTMLElement;
  grid: HTMLElement;
}

export interface ShowMoreOptions {
  targetId?: string;
  hiddenClass?: string;
  chunkSize?: number;
  autoUpdate?: boolean;
  observerDelay?: number;
  containerTransitionDelay?: number;
  onShow?: (() => void) | null;
  onHide?: (() => void) | null;
  onCardsChanged?: ((newCount: number, oldCount: number) => void) | null;
}

export interface ShowMoreAPI {
  updateCards: () => void;
  getCurrentCount: () => number;
  getRevealedCount: () => number;
}

export interface LocalizedStrings {
  showAllText: string;
  hideText: string;
}

// Tipos para el manejo de animaciones
export type AnimationPromise = Promise<void>;
export type AnimationCallback = () => void;