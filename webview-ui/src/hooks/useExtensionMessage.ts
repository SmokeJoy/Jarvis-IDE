import { useCallback } from 'react'
import { vscode } from '../utilities/vscode'
import {
  Message as UnifiedMessage,
  isExtensionMessage,
} from '@shared/messages'

/**
 * Hook personalizzato per gestire la comunicazione type-safe con l'estensione VS Code
 * @returns Un oggetto contenente la funzione type-safe per inviare messaggi
 */
export const useExtensionMessage = () => {
    /**
     * Invia un messaggio all'estensione VS Code con sicurezza di tipo utilizzando union discriminate
     * @param message Un messaggio WebView fortemente tipizzato
     */
    const postMessage = useCallback(<T extends UnifiedMessage>(message: T) => {
        vscode.postMessage(message)
    }, [])

    /**
     * Invia un messaggio all'estensione VS Code in base al tipo specificato
     * @param type Tipo del messaggio
     * @param payload Payload del messaggio
     */
    const sendMessageByType = useCallback((
      type: UnifiedMessage['type'],
      payload?: Record<string, unknown>
    ) => {
      const msg = { type, ...(payload ? { payload } : {}) } as UnifiedMessage;
      vscode.postMessage(msg);
    }, [])

    /**
     * Registra un listener per i messaggi provenienti dall'estensione VS Code
     * @param callback Funzione chiamata con un messaggio validato ExtensionMessageUnion
     */
    const addMessageListener = useCallback((callback: (message: UnifiedMessage) => void) => {
        const handler = (event: MessageEvent) => {
            const message = event.data;
            if (isExtensionMessage(message)) {
                callback(message);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    /**
     * Rimuove un listener per i messaggi provenienti dall'estensione VS Code
     * @param callback Funzione precedentemente registrata
     */
    const removeMessageListener = useCallback((callback: (message: UnifiedMessage) => void) => {
        // Per semplicità, non implementiamo la rimozione diretta della callback,
        // ma si può estendere con una mappa interna se necessario.
        // Qui si assume che venga usato il return di addMessageListener per cleanup.
    }, []);

    return {
        postMessage,
        sendMessageByType,
        addMessageListener,
        removeMessageListener
    }
} 