import { Anthropic } from "@anthropic-ai/sdk"
import type { ApiConfiguration, ModelInfo } from "../shared/types/api.types.js.js"
import type { AnthropicHandler } from "./providers/anthropic.js.js"
import type { AwsBedrockHandler } from "./providers/bedrock.js.js"
import type { OpenRouterHandler } from "./providers/openrouter.js.js"
import type { VertexHandler } from "./providers/vertex.js.js"
import type { OpenAiHandler } from "./providers/openai.js.js"
import type { OllamaHandler } from "./providers/ollama.js.js"
import type { LmStudioHandler } from "./providers/lmstudio.js.js"
import type { GeminiHandler } from "./providers/gemini.js.js"
import type { OpenAiNativeHandler } from "./providers/openai-native.js.js"
import { ApiStream, ApiStreamUsageChunk } from "./transform/stream.js.js"
import type { DeepSeekHandler } from "./providers/deepseek.js.js"
import type { RequestyHandler } from "./providers/requesty.js.js"
import type { TogetherHandler } from "./providers/together.js.js"
import type { QwenHandler } from "./providers/qwen.js.js"
import type { MistralHandler } from "./providers/mistral.js.js"
import type { VsCodeLmHandler } from "./providers/vscode-lm.js.js"
import type { JarvisIdeHandler } from "./providers/jarvis-ide.js.js"
import type { LiteLlmHandler } from "./providers/litellm.js.js"
import type { AskSageHandler } from "./providers/asksage.js.js"
import type { XAIHandler } from "./providers/xai.js.js"
import type { SambanovaHandler } from "./providers/sambanova.js.js"
import * as OpenAI from 'openai'

export interface ApiHandler {
	createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream
	getModel(): { id: string; info: ModelInfo }
	getApiStreamUsage?(): Promise<ApiStreamUsageChunk | undefined>
}

export interface SingleCompletionHandler {
	completePrompt(prompt: string): Promise<string>
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
	const { provider, ...options } = configuration
	switch (provider) {
		case "anthropic":
			return new AnthropicHandler(options)
		case "openrouter":
			const modelInfo = options.openRouterModelInfo ? {
				...options.openRouterModelInfo,
				id: options.openRouterModelInfo.id || options.openRouterModelId || "",
				name: options.openRouterModelInfo.name || "",
				context_length: options.openRouterModelInfo.context_length || 0,
				contextWindow: options.openRouterModelInfo.contextWindow || 0,
				temperature: options.openRouterModelInfo.temperature || 0,
				maxTokens: options.openRouterModelInfo.maxTokens || 0,
				description: options.openRouterModelInfo.description || "",
				provider: options.openRouterModelInfo.provider || "",
				inputPrice: options.openRouterModelInfo.inputPrice || 0,
				outputPrice: options.openRouterModelInfo.outputPrice || 0,
				supportsPromptCache: options.openRouterModelInfo.supportsPromptCache || false,
				supportsFunctionCalling: options.openRouterModelInfo.supportsFunctionCalling || false,
				supportsVision: options.openRouterModelInfo.supportsVision || false
			} : {
				id: options.openRouterModelId || "",
				name: "",
				context_length: 0,
				contextWindow: 0,
				temperature: 0,
				maxTokens: 0,
				description: "",
				provider: "",
				inputPrice: 0,
				outputPrice: 0,
				supportsPromptCache: false,
				supportsFunctionCalling: false,
				supportsVision: false
			};
			
			return new OpenRouterHandler({
				apiKey: options.openRouterApiKey || "",
				model: modelInfo
			})
		case "bedrock":
			return new AwsBedrockHandler(options)
		case "vertex":
			return new VertexHandler(options)
		case "openai":
			return new OpenAiHandler(options)
		case "ollama":
			return new OllamaHandler(options)
		case "lmstudio":
			return new LmStudioHandler(options)
		case "gemini":
			return new GeminiHandler(options)
		case "openai-native":
			return new OpenAiNativeHandler(options)
		case "deepseek":
			return new DeepSeekHandler(options)
		case "requesty":
			return new RequestyHandler(options)
		case "together":
			return new TogetherHandler(options)
		case "qwen":
			return new QwenHandler(options)
		case "mistral":
			return new MistralHandler(options)
		case "vscode-lm":
			return new VsCodeLmHandler(options)
		case "jarvis-ide":
			return new JarvisIdeHandler(options)
		case "litellm":
			return new LiteLlmHandler(options)
		case "asksage":
			return new AskSageHandler(options)
		case "xai":
			return new XAIHandler(options)
		case "sambanova":
			return new SambanovaHandler(options)
		default:
			return new AnthropicHandler(options)
	}
}
