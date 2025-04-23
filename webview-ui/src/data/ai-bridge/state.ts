/**
 * @file state.ts
 * @description Gestione dello stato per il modulo ai-bridge
 * @author dev ai 1
 */

import { reactive } from 'vue';
import type { AiBridgeState, AiRequestStatus } from './types';
import { INITIAL_STATE } from './constants';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('AiBridgeState');

// Stato reattivo
const state = reactive<AiBridgeState>({ ...INITIAL_STATE });

// Singleton per la gestione dello stato
class AiBridgeStateManager {
  private static instance: AiBridgeStateManager;
  private listeners: Set<(state: AiBridgeState) => void>;

  private constructor() {
    this.listeners = new Set();
  }

  public static getInstance(): AiBridgeStateManager {
    if (!AiBridgeStateManager.instance) {
      AiBridgeStateManager.instance = new AiBridgeStateManager();
    }
    return AiBridgeStateManager.instance;
  }

  // Getters
  public getState(): Readonly<AiBridgeState> {
    return { ...state };
  }

  // Setters
  public setStatus(status: AiRequestStatus): void {
    state.status = status;
    componentLogger.debug('Stato aggiornato:', { status });
    this.notifyListeners();
  }

  public setResponse(response: string): void {
    state.response = response;
    componentLogger.debug('Risposta aggiornata');
    this.notifyListeners();
  }

  public setError(error: string): void {
    state.error = error;
    state.status = 'error';
    componentLogger.error('Errore:', { error });
    this.notifyListeners();
  }

  public updateTokens(tokens: number): void {
    state.tokens = tokens;
    componentLogger.debug('Token aggiornati:', { tokens });
    this.notifyListeners();
  }

  public setRequestId(requestId: string | null): void {
    state.requestId = requestId;
    componentLogger.debug('ID richiesta aggiornato:', { requestId });
    this.notifyListeners();
  }

  // Reset
  public reset(): void {
    Object.assign(state, INITIAL_STATE);
    componentLogger.info('Stato resettato');
    this.notifyListeners();
  }

  // Subscription management
  public subscribe(listener: (state: AiBridgeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }
}

// Esporta l'istanza singleton
export const aiBridgeStateManager = AiBridgeStateManager.getInstance(); 
 