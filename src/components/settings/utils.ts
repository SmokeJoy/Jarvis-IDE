import { ApiConfiguration } from '../../types/extension';
import { ModelInfo } from '../../types/models';

export function getModelInfo(apiConfiguration: ApiConfiguration): ModelInfo {
  return {
    id: apiConfiguration.selectedModel || '',
    name: apiConfiguration.selectedModel || '',
    maxTokens: 4096,
    tokenLimit: 4096,
    supportsFunctionCalling: true,
  };
}
