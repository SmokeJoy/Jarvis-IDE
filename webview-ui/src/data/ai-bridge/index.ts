/**
 * @file index.ts
 * @description API pubblica per il modulo ai-bridge
 * @author dev ai 1
 */

import type { AiBridgeOptions, AiBridgeState, AiRequestStatus } from './types';
import { aiBridgeStateManager } from './state';
import { initializeMessageHandlers } from './handlers';
import { 
  sendAiRequest,
  cancelAiRequest,
  requestAiStatus,
  sendResetMessage
} from './transport';
import { formatError } from './utils';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('AiBridge');

/**
 * Crea un'istanza del bridge AI
 */
export function createAiBridge(options: AiBridgeOptions) {
  const { bridge, onResponse, onError, onTokenUpdate, onStatusChange } = options;

  try {
    // Inizializza gli handler dei messaggi
    initializeMessageHandlers({
      bridge,
      state: aiBridgeStateManager
    });

    // Sottoscrivi i listener agli eventi di stato
    if (onResponse || onError || onTokenUpdate || onStatusChange) {
      aiBridgeStateManager.subscribe(state => {
        // Notifica cambiamenti di stato
        if (onStatusChange) {
          onStatusChange(state.status);
        }

        // Notifica errori
        if (state.error && onError) {
          onError(state.error);
        }

        // Notifica aggiornamenti token
        if (onTokenUpdate) {
          onTokenUpdate(state.tokens);
        }

        // Notifica risposta completata
        if (state.status === 'done' && onResponse) {
          onResponse({ text: state.response });
        }
      });
    }

    componentLogger.debug('Bridge AI inizializzato');

  } catch (error) {
    const errorMessage = formatError(error);
    componentLogger.error('Errore durante l\'inizializzazione:', { error: errorMessage });
    throw new Error(`Impossibile inizializzare il bridge AI: ${errorMessage}`);
  }

  return {
    // Getters
    getState: () => aiBridgeStateManager.getState(),
    getStatus: () => aiBridgeStateManager.getState().status,
    getResponse: () => aiBridgeStateManager.getState().response,
    getTokens: () => aiBridgeStateManager.getState().tokens,
    getError: () => aiBridgeStateManager.getState().error,

    // Actions
    sendRequest: (request: AiRequest) => {
      const requestId = sendAiRequest(bridge, request);
      aiBridgeStateManager.setRequestId(requestId);
      aiBridgeStateManager.setStatus('pending');
      return requestId;
    },

    cancelRequest: () => {
      const { requestId } = aiBridgeStateManager.getState();
      if (requestId) {
        cancelAiRequest(bridge, requestId);
        aiBridgeStateManager.reset();
      }
    },

    reset: () => {
      sendResetMessage(bridge);
      aiBridgeStateManager.reset();
    },

    requestStatus: () => requestAiStatus(bridge)
  };
}

// Types
export type { AiBridgeState, AiRequestStatus };

// Constants
export { INITIAL_STATE } from './constants'; 
 