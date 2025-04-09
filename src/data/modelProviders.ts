import type { OpenAiCompatibleModelInfo } from "../shared/types/api.types.js"
import { OPENROUTER_MODELS } from "./openrouterModels.js"

import type { LLMProviderId } from "../shared/types/llm.types.js"

/**
 * Tipo che rappresenta i provider di modelli supportati
 * @deprecated Utilizzare LLMProviderId da llm.types.ts
 */
export type ModelProvider = LLMProviderId

export interface ModelProviderInfo {
  name: string
  description: string
  models: OpenAiCompatibleModelInfo[]
}

export const MODEL_PROVIDERS: Record<string, string> = {
  'openrouter:gpt-4': 'OpenRouter',
  'openrouter:claude-2': 'OpenRouter',
  'anthropic:claude-2': 'Anthropic',
  'anthropic:claude-instant': 'Anthropic',
  'openai:gpt-4': 'OpenAI',
  'openai:gpt-3.5-turbo': 'OpenAI',
  'google:gemini-pro': 'Google',
  'mistral:mistral-medium': 'Mistral',
  'deepseek:deepseek-coder': 'DeepSeek'
}

export function getProviderFromModelId(id: string): string {
  const [provider] = id.split(':')
  return MODEL_PROVIDERS[id] || provider || 'Unknown'
}