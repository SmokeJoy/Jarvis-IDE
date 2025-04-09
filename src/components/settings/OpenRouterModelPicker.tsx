import React from 'react'
import { VSCodeDropdown } from '@vscode/webview-ui-toolkit/react'
import type { ConfigModelInfo } from '../../types/models.js.js'
import type { ApiConfiguration } from '../../types/api.types.js.js'

interface OpenRouterModelPickerProps {
  apiConfiguration: ApiConfiguration
  onApiConfigurationChange: (config: Partial<ApiConfiguration>) => void
}

export const OpenRouterModelPicker: React.FC<OpenRouterModelPickerProps> = ({
  apiConfiguration,
  onApiConfigurationChange,
}) => {
  const handleModelChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    onApiConfigurationChange({
      selectedModel: value,
      modelInfo: models.find(m => m.value === value)
    })
  }

  return (
    <div className="model-picker">
      <VSCodeDropdown
        value={apiConfiguration.selectedModel}
        onChange={handleModelChange}
      >
        {models.map(model => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </VSCodeDropdown>
    </div>
  )
} 