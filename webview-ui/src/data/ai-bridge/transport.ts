/**
 * @file transport.ts
 * @description Gestione del trasporto dei messaggi per il modulo ai-bridge
 * @author dev ai 1
 */

import type { WebviewBridge } from '@shared/utils/WebviewBridge';
import type { AiRequest } from '@shared/messages';
import { WebviewMessageType } from '@shared/messages';
import { generateRequestId } from './utils';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('AiBridgeTransport');

/**
 * Invia una richiesta AI all'estensione
 */
export function sendAiRequest(bridge: WebviewBridge, request: AiRequest): string {
  const requestId = generateRequestId();
  
  bridge.sendMessage({
    type: WebviewMessageType.AI_REQUEST,
    payload: {
      ...request,
      requestId
    }
  });

  componentLogger.debug('Richiesta AI inviata:', { requestId });
  return requestId;
}

/**
 * Cancella una richiesta AI in corso
 */
export function cancelAiRequest(bridge: WebviewBridge, requestId: string): void {
  bridge.sendMessage({
    type: WebviewMessageType.CANCEL_REQUEST,
    payload: { requestId }
  });

  componentLogger.debug('Richiesta di cancellazione inviata:', { requestId });
}

/**
 * Richiede lo stato corrente del modello AI
 */
export function requestAiStatus(bridge: WebviewBridge): void {
  bridge.sendMessage({
    type: WebviewMessageType.GET_AI_STATUS
  });

  componentLogger.debug('Richiesta stato AI inviata');
}

/**
 * Invia un messaggio di reset all'estensione
 */
export function sendResetMessage(bridge: WebviewBridge): void {
  bridge.sendMessage({
    type: WebviewMessageType.RESET_AI
  });

  componentLogger.debug('Messaggio di reset inviato');
} 
 