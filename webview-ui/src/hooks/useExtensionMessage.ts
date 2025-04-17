import { useCallback } from 'react'
import type { WebviewMessage, WebviewMessageType } from '../../../src/shared/types/webview.types'
import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion'
import { vscode } from '../utilities/vscode'
import type { ExtensionMessageUnion } from '@shared/types/extension-message'
import { isExtensionMessage } from '@shared/types/extensionMessageUnion'
import type { AgentMessageUnion } from '@shared/types/mas-message'

type UnifiedMessage = AgentMessageUnion | ExtensionMessageUnion;

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
    const sendMessageByType = useCallback(<T extends string>(
        type: T,
        payload?: Record<string, unknown>
    ) => {
        const message = { type, payload }
        vscode.postMessage(message)
    }, [])

    /**
     * Registra un listener per i messaggi provenienti dall'estensione VS Code
     * @param callback Funzione chiamata con un messaggio validato ExtensionMessageUnion
     */
    const addMessageListener = useCallback((callback: (message: ExtensionMessageUnion) => void) => {
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
    const removeMessageListener = useCallback((callback: (message: ExtensionMessageUnion) => void) => {
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