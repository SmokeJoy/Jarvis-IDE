import { ApiConfiguration } from '../../types/extension.js'
import { ModelInfo } from '../../types/models.js'

export function getModelInfo(apiConfiguration: ApiConfiguration): ModelInfo {
  return {
    id: apiConfiguration.selectedModel || '',
    name: apiConfiguration.selectedModel || '',
    maxTokens: 4096,
    tokenLimit: 4096,
    supportsFunctionCalling: true
  }
} 