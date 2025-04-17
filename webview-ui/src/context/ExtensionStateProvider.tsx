import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ApiConfiguration } from '@shared/types/api.types'

interface ExtensionStateContextType {
  version: string
  didHydrateState: boolean
  showWelcome: boolean
  apiConfiguration: ApiConfiguration
  setApiConfiguration: (config: ApiConfiguration) => void
  customInstructions: string
  setCustomInstructions: (instructions: string) => void
}

const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined)

export const useExtensionState = () => {
  const context = useContext(ExtensionStateContext)
  if (!context) {
    throw new Error('useExtensionState must be used within an ExtensionStateProvider')
  }
  return context
}

interface ExtensionStateProviderProps {
  children: React.ReactNode
}

export const ExtensionStateProvider: React.FC<ExtensionStateProviderProps> = ({ children }) => {
  const [version, setVersion] = useState<string>('1.0.0')
  const [didHydrateState, setDidHydrateState] = useState<boolean>(false)
  const [showWelcome, setShowWelcome] = useState<boolean>(true)
  const [apiConfiguration, setApiConfiguration] = useState<ApiConfiguration>({
    provider: '',
    apiKey: '',
    modelId: '',
    modelName: ''
  })
  const [customInstructions, setCustomInstructions] = useState<string>('')

  const handleApiConfigurationChange = useCallback((config: ApiConfiguration) => {
    setApiConfiguration(config)
  }, [])

  const handleCustomInstructionsChange = useCallback((instructions: string) => {
    setCustomInstructions(instructions)
  }, [])

  const value = {
    version,
    didHydrateState,
    showWelcome,
    apiConfiguration,
    setApiConfiguration: handleApiConfigurationChange,
    customInstructions,
    setCustomInstructions: handleCustomInstructionsChange
  }

  return (
    <ExtensionStateContext.Provider value={value}>
      {children}
    </ExtensionStateContext.Provider>
  )
} 