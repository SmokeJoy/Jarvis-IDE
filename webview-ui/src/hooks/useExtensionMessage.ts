import { useCallback } from 'react'
import { WebviewMessage } from '../../src/shared/types/webview.types'
import { vscode } from '../utilities/vscode'

export const useExtensionMessage = () => {
    const postMessage = useCallback((message: WebviewMessage) => {
        vscode.postMessage(message)
    }, [])

    return { postMessage }
} 