import { useCallback } from 'react'
import type { WebviewMessage, WebviewMessageType } from '../../../src/shared/types/webview.types'
import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion'
import { vscode } from '../utilities/vscode'

/**
 * Hook personalizzato per gestire la comunicazione type-safe con l'estensione VS Code
 * @returns Un oggetto contenente la funzione type-safe per inviare messaggi
 */
export const useExtensionMessage = () => {
    /**
     * Invia un messaggio all'estensione VS Code con sicurezza di tipo utilizzando union discriminate
     * @param message Un messaggio WebView fortemente tipizzato
     */
    const postMessage = useCallback(<T extends WebviewMessageUnion>(message: T) => {
        vscode.postMessage(message)
    }, [])

    /**
     * Invia un messaggio all'estensione VS Code in base al tipo specificato
     * @param type Tipo del messaggio
     * @param payload Payload del messaggio
     */
    const sendMessageByType = useCallback(<T extends WebviewMessageType | string>(
        type: T,
        payload?: Record<string, unknown>
    ) => {
        const message: WebviewMessage = { type, payload }
        vscode.postMessage(message)
    }, [])

    return { 
        postMessage,
        sendMessageByType
    }
} 