import type { ApiConfiguration } from '../../types/extension.js.js'
import type { ModelInfo } from '../../types/models.js.js'

export function getModelInfo(apiConfiguration: ApiConfiguration): ModelInfo {
  return {
    id: apiConfiguration.selectedModel || '',
    name: apiConfiguration.selectedModel || '',
    maxTokens: 4096,
    tokenLimit: 4096,
    supportsFunctionCalling: true
  }
} 