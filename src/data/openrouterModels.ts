import type { OpenAiCompatibleModelInfo } from "../shared/types/api.types.js"

export const OPENROUTER_MODELS: OpenAiCompatibleModelInfo[] = [
  {
    id: "mistralai/mixtral-8x7b",
    name: "Mixtral 8x7B",
    context_length: 32768,
    temperature: 0.7,
    supportsStreaming: true,
    maxTokens: 32768,
    contextWindow: 32768,
    description: "Mixtral 8x7B modello multimodale",
    provider: "mistralai",
    inputPrice: 0.0006,
    outputPrice: 0.0012,
    supportsPromptCache: true,
    supportsFunctionCalling: true,
    supportsVision: false
  },
  {
    id: "meta-llama/llama-2-70b-chat",
    name: "LLaMA 2 70B Chat",
    context_length: 4096,
    temperature: 0.7,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 4096,
    description: "LLaMA 2 70B modello conversazionale",
    provider: "meta",
    inputPrice: 0.0005,
    outputPrice: 0.0010,
    supportsPromptCache: true,
    supportsFunctionCalling: false,
    supportsVision: false
  },
  {
    id: "deepo seek-ai/deepseek-coder",
    name: "DeepSeek Coder",
    context_length: 16384,
    temperature: 0.2,
    supportsStreaming: true,
    maxTokens: 16384,
    contextWindow: 16384,
    description: "DeepSeek Coder modello per codice",
    provider: "deepseek",
    inputPrice: 0.0002,
    outputPrice: 0.0008,
    supportsPromptCache: true,
    supportsFunctionCalling: true,
    supportsVision: false
  }
]