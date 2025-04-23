import { webviewBridge } from '@webview/utils/WebviewBridge';
import logger from '@shared/utils/outputLogger';
import { WebviewMessage, ExtensionMessage } from '@shared/messages';
import { isErrorMessage, isNavigationMessage } from './guards';

const componentLogger = logger.createComponentLogger('RouterHandlers');

/**
 * Handler per i messaggi di errore
 */
export async function handleErrorMessage(msg: WebviewMessage): Promise<void> {
  if (!isErrorMessage(msg)) return;

  componentLogger.error('Errore ricevuto:', (msg.payload as unknown).message);
  
  // Qui puoi aggiungere logica per gestire l'errore (es. mostrare un toast)
}

/**
 * Handler per i messaggi di navigazione
 */
export async function handleNavigationMessage(msg: WebviewMessage): Promise<void> {
  if (!isNavigationMessage(msg)) return;

  try {
    // Invia il messaggio di navigazione all'estensione
    webviewBridge.sendMessage<ExtensionMessage>({
      type: 'navigate',
      payload: {
        route: (msg.payload as unknown).route
      }
    });
  } catch (error) {
    componentLogger.error('Errore durante la navigazione:', error);
    throw error;
  }
}

/**
 * Mappa degli handler per tipo di messaggio
 */
export const messageHandlers = new Map<WebviewMessage['type'], (msg: WebviewMessage) => Promise<void>>([
  ['error', handleErrorMessage],
  ['navigate', handleNavigationMessage]
]);
