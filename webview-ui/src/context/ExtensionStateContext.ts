import { createContext, useContext } from 'react'
import { ExtensionState } from '../types/extension'

export const ExtensionStateContext = createContext<ExtensionState | null>(null)

ExtensionStateContext.displayName = 'ExtensionStateContext'

export const useExtensionState = () => {
  const context = useContext(ExtensionStateContext)
  if (!context) {
    throw new Error('useExtensionState must be used within an ExtensionStateProvider')
  }
  return context
} 