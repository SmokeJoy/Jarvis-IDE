import { useContext } from 'react'
import { ExtensionStateContext } from '../context/ExtensionStateContext'
import { ExtensionState } from '../types/extension'

export const useExtensionState = (): ExtensionState => {
    const context = useContext(ExtensionStateContext)
    if (!context) {
        throw new Error('useExtensionState must be used within an ExtensionStateProvider')
    }
    return context
} 