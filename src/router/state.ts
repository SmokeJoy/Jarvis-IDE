import { AppRoute, isValidRoute } from './routes';
import { logger } from '../utils/logger';

/**
 * Interfaccia dello stato del router
 */
export interface RouterState {
  currentRoute: AppRoute;
  previousRoute: AppRoute | null;
  params: Record<string, string>;
}

/**
 * Stato iniziale del router
 */
const INITIAL_STATE: RouterState = {
  currentRoute: AppRoute.HOME,
  previousRoute: null,
  params: {}
};

/**
 * Tipo per i listener dello stato
 */
type StateListener = (state: RouterState) => void;

/**
 * Classe per la gestione dello stato del router
 */
export class RouterStateManager {
  private static instance: RouterStateManager;
  private state: RouterState;
  private listeners: Set<StateListener>;

  private constructor() {
    this.state = { ...INITIAL_STATE };
    this.listeners = new Set();
  }

  /**
   * Ottiene l'istanza singleton del manager
   */
  public static getInstance(): RouterStateManager {
    if (!RouterStateManager.instance) {
      RouterStateManager.instance = new RouterStateManager();
    }
    return RouterStateManager.instance;
  }

  /**
   * Ottiene lo stato corrente
   */
  public getState(): RouterState {
    return { ...this.state };
  }

  /**
   * Imposta una nuova rotta
   */
  public setRoute(route: string, params: Record<string, string> = {}): void {
    if (!isValidRoute(route)) {
      logger.error(`Invalid route: ${route}`);
      return;
    }

    const previousRoute = this.state.currentRoute;
    this.setState({
      currentRoute: route,
      previousRoute,
      params
    });
  }

  /**
   * Torna alla rotta precedente
   */
  public goBack(): void {
    if (this.state.previousRoute) {
      this.setRoute(this.state.previousRoute);
    } else {
      this.setRoute(AppRoute.HOME);
    }
  }

  /**
   * Resetta lo stato
   */
  public reset(): void {
    this.setState({ ...INITIAL_STATE });
  }

  /**
   * Aggiunge un listener per i cambiamenti di stato
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Imposta un nuovo stato e notifica i listener
   */
  private setState(newState: RouterState): void {
    this.state = { ...newState };
    this.notifyListeners();
  }

  /**
   * Notifica tutti i listener del cambio di stato
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        logger.error('Error in router state listener:', error);
      }
    });
  }
} 