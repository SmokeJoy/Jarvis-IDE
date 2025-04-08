import { Anthropic } from "@anthropic-ai/sdk"
import type { ApiConfiguration, ModelInfo } from "../shared/types/api.types.js"
import { AnthropicHandler } from "./providers/anthropic.js"
import { AwsBedrockHandler } from "./providers/bedrock.js"
import { OpenRouterHandler } from "./providers/openrouter.js"
import { VertexHandler } from "./providers/vertex.js"
import { OpenAiHandler } from "./providers/openai.js"
import { OllamaHandler } from "./providers/ollama.js"
import { LmStudioHandler } from "./providers/lmstudio.js"
import { GeminiHandler } from "./providers/gemini.js"
import { OpenAiNativeHandler } from "./providers/openai-native.js"
import { ApiStream, ApiStreamUsageChunk } from "./transform/stream.js"
import { DeepSeekHandler } from "./providers/deepseek.js"
import { RequestyHandler } from "./providers/requesty.js"
import { TogetherHandler } from "./providers/together.js"
import { QwenHandler } from "./providers/qwen.js"
import { MistralHandler } from "./providers/mistral.js"
import { VsCodeLmHandler } from "./providers/vscode-lm.js"
import { JarvisIdeHandler } from "./providers/jarvis-ide.js"
import { LiteLlmHandler } from "./providers/litellm.js"
import { AskSageHandler } from "./providers/asksage.js"
import { XAIHandler } from "./providers/xai.js"
import { SambanovaHandler } from "./providers/sambanova.js"
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
