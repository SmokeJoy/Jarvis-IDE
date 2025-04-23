/**
 * @file handlers.ts
 * @description Handler per i messaggi del modulo ai-bridge
 * @author dev ai 1
 */

import type { AiBridgeContext } from './types';
import { 
  isAiResponseMessage,
  isTokenStreamUpdate,
  isCancelMessage,
  isErrorMessage
} from '@shared/messages/guards';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('AiBridgeHandlers');

/**
 * Inizializza gli handler dei messaggi
 */
export function initializeMessageHandlers(context: AiBridgeContext): void {
  const { bridge, state } = context;

  // Handler per le risposte AI
  bridge.on('aiResponse', message => {
    if (!isAiResponseMessage(message)) {
      componentLogger.warn('Messaggio AI non valido:', { message });
      return;
    }

    const { response, requestId } = (msg.payload as unknown);

    // Verifica che la risposta corrisponda alla richiesta corrente
    if (requestId !== state.getState().requestId) {
      componentLogger.warn('ID richiesta non corrispondente:', { 
        expected: state.getState().requestId,
        received: requestId 
      });
      return;
    }

    state.setResponse(response);
    state.setStatus('done');
  });

  // Handler per gli aggiornamenti dei token
  bridge.on('tokenUpdate', message => {
    if (!isTokenStreamUpdate(message)) {
      componentLogger.warn('Aggiornamento token non valido:', { message });
      return;
    }

    const { tokens, requestId } = (msg.payload as unknown);

    // Verifica che l'aggiornamento corrisponda alla richiesta corrente
    if (requestId !== state.getState().requestId) {
      componentLogger.warn('ID richiesta non corrispondente per token:', {
        expected: state.getState().requestId,
        received: requestId
      });
      return;
    }

    state.updateTokens(tokens);
    if (state.getState().status === 'pending') {
      state.setStatus('streaming');
    }
  });

  // Handler per i messaggi di cancellazione
  bridge.on('cancel', message => {
    if (!isCancelMessage(message)) {
      componentLogger.warn('Messaggio di cancellazione non valido:', { message });
      return;
    }

    const { requestId } = (msg.payload as unknown);

    // Verifica che la cancellazione corrisponda alla richiesta corrente
    if (requestId !== state.getState().requestId) {
      componentLogger.warn('ID richiesta non corrispondente per cancellazione:', {
        expected: state.getState().requestId,
        received: requestId
      });
      return;
    }

    state.reset();
  });

  // Handler per i messaggi di errore
  bridge.on('error', message => {
    if (!isErrorMessage(message)) {
      componentLogger.warn('Messaggio di errore non valido:', { message });
      return;
    }

    const { error, requestId } = (msg.payload as unknown);

    // Verifica che l'errore corrisponda alla richiesta corrente
    if (requestId && requestId !== state.getState().requestId) {
      componentLogger.warn('ID richiesta non corrispondente per errore:', {
        expected: state.getState().requestId,
        received: requestId
      });
      return;
    }

    state.setError(error);
  });
} 
 