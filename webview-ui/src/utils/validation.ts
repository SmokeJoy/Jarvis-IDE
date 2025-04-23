// Invece di importare da un percorso che non funziona, definiamo qui lo stesso tipo
interface OpenAiCompatibleModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  trainingCutoff?: string;
  endpoints?: string[];
  capabilities?: string[];
  maxTokens?: number;
}

export const validateApiConfiguration = (config: any): string[] => {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Provider is required');
  }

  if (config.provider === 'openai' && !config.openAiApiKey) {
    errors.push('OpenAI API key is required');
  }

  if (config.provider === 'anthropic' && !config.anthropicApiKey) {
    errors.push('Anthropic API key is required');
  }

  if (config.provider === 'openrouter' && !config.openRouterApiKey) {
    errors.push('OpenRouter API key is required');
  }

  return errors;
};

export const validateModelInfo = (model: OpenAiCompatibleModelInfo): string[] => {
  const errors: string[] = [];

  if (!model.id) {
    errors.push('Model ID is required');
  }

  if (!model.name) {
    errors.push('Model name is required');
  }

  if (typeof model.context_length !== 'number') {
    errors.push('Context length must be a number');
  }

  if (typeof model.temperature !== 'number') {
    errors.push('Temperature must be a number');
  }

  if (typeof model.maxTokens !== 'number') {
    errors.push('Max tokens must be a number');
  }

  if (typeof model.contextWindow !== 'number') {
    errors.push('Context window must be a number');
  }

  if (typeof model.supportsPromptCache !== 'boolean') {
    errors.push('Supports prompt cache must be a boolean');
  }

  if (typeof model.supportsFunctionCalling !== 'boolean') {
    errors.push('Supports function calling must be a boolean');
  }

  if (typeof model.supportsVision !== 'boolean') {
    errors.push('Supports vision must be a boolean');
  }

  return errors;
}; 