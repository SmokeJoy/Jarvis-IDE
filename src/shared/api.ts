import { OpenAiCompatibleModelInfo, ApiConfiguration, ModelInfo, ApiHandlerOptions } from "./types/api.types.js"
import { ApiProvider } from "../agent/api/ApiProvider.js"

// Esporta esplicitamente i tipi importati
export type { OpenAiCompatibleModelInfo, ApiConfiguration, ModelInfo, ApiHandlerOptions, ApiProvider }

// Models

// Anthropic
// https://docs.anthropic.com/en/docs/about-claude/models // prices updated 2025-01-02
export type AnthropicModelId = keyof typeof anthropicModels
export const anthropicDefaultModelId: AnthropicModelId = "claude-3-7-sonnet-20250219"
export const anthropicModels = {
	"claude-3-7-sonnet-20250219": {
		id: "claude-3-7-sonnet-20250219",
		name: "Claude 3.7 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		provider: "anthropic"
	},
	"claude-3-5-sonnet-20241022": {
		id: "claude-3-5-sonnet-20241022",
		name: "Claude 3.5 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0, // $3 per million input tokens
		outputPrice: 15.0, // $15 per million output tokens
		cacheWritesPrice: 3.75, // $3.75 per million tokens
		cacheReadsPrice: 0.3, // $0.30 per million tokens
		provider: "anthropic"
	},
	"claude-3-5-haiku-20241022": {
		id: "claude-3-5-haiku-20241022",
		name: "Claude 3.5 Haiku",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.8,
		outputPrice: 4.0,
		cacheWritesPrice: 1.0,
		cacheReadsPrice: 0.08,
		provider: "anthropic"
	},
	"claude-3-opus-20240229": {
		id: "claude-3-opus-20240229",
		name: "Claude 3 Opus",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 15,
		outputPrice: 75,
		cacheWritesPrice: 18.75,
		cacheReadsPrice: 1.5,
		provider: "anthropic"
	},
	"claude-3-sonnet-20240229": {
		id: "claude-3-sonnet-20240229",
		name: "Claude 3 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3,
		outputPrice: 15,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		provider: "anthropic"
	},
	"claude-3-haiku-20240307": {
		id: "claude-3-haiku-20240307",
		name: "Claude 3 Haiku",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.8,
		outputPrice: 4,
		cacheWritesPrice: 1,
		cacheReadsPrice: 0.08,
		provider: "anthropic"
	},
	"claude-3.5-sonnet-20240620": {
		id: "claude-3.5-sonnet-20240620",
		name: "Claude 3.5 Sonnet",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 15,
		outputPrice: 75,
		cacheWritesPrice: 18.75,
		cacheReadsPrice: 1.5,
		provider: "anthropic"
	},
	"claude-instant-1.2": {
		id: "claude-instant-1.2",
		name: "Claude Instant 1.2",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0.25,
		outputPrice: 1.25,
		cacheWritesPrice: 0.3,
		cacheReadsPrice: 0.03,
		provider: "anthropic"
	}
} as const satisfies Record<string, ModelInfo>

// Base Default Model Info
export const defaultModelInfo: ModelInfo = {
	id: "default-model",
	name: "Default Model",
	contextLength: 8192,
	maxTokens: 4096,
	contextWindow: 8192,
	supportsImages: false,
	supportsPromptCache: false,
	inputPrice: 0,
	outputPrice: 0,
	description: "Default model info",
	provider: "default"
};

// AWS Bedrock
// https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
export type BedrockModelId = "amazon.nova-pro-v1:0"
export const bedrockDefaultModelId: BedrockModelId = "amazon.nova-pro-v1:0"
export const bedrockModels = {
	"amazon.nova-pro-v1:0": {
		id: "amazon.nova-pro-v1:0",
		name: "Amazon Nova Pro",
		contextLength: 300000,
		maxTokens: 5000,
		contextWindow: 300_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.8,
		outputPrice: 3.2,
		provider: "aws"
	},
	"amazon.nova-lite-v1:0": {
		id: "amazon.nova-lite-v1:0",
		name: "Amazon Nova Lite",
		contextLength: 300000,
		maxTokens: 5000,
		contextWindow: 300_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.06,
		outputPrice: 0.24,
		provider: "aws"
	},
	"amazon.nova-micro-v1:0": {
		id: "amazon.nova-micro-v1:0",
		name: "Amazon Nova Micro",
		contextLength: 128000,
		maxTokens: 5000,
		contextWindow: 128_000,
		supportsImages: false,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.035,
		outputPrice: 0.14,
		provider: "aws"
	},
	"anthropic.claude-3-7-sonnet-20250219-v1:0": {
		id: "anthropic.claude-3-7-sonnet-20250219-v1:0",
		name: "Anthropic Claude 3.7 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		provider: "aws"
	},
	"anthropic.claude-3-5-sonnet-20241022-v2:0": {
		id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
		name: "Anthropic Claude 3.5 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		provider: "aws"
	},
	"anthropic.claude-3-5-haiku-20241022-v1:0": {
		id: "anthropic.claude-3-5-haiku-20241022-v1:0",
		name: "Anthropic Claude 3.5 Haiku",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 1.0,
		outputPrice: 5.0,
		cacheWritesPrice: 1.0,
		cacheReadsPrice: 0.08,
		provider: "aws"
	},
	"anthropic.claude-3-5-sonnet-20240620-v1:0": {
		id: "anthropic.claude-3-5-sonnet-20240620-v1:0",
		name: "Anthropic Claude 3.5 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
		provider: "aws"
	},
	"anthropic.claude-3-opus-20240229-v1:0": {
		id: "anthropic.claude-3-opus-20240229-v1:0",
		name: "Anthropic Claude 3 Opus",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 15.0,
		outputPrice: 75.0,
		provider: "aws"
	},
	"anthropic.claude-3-sonnet-20240229-v1:0": {
		id: "anthropic.claude-3-sonnet-20240229-v1:0",
		name: "Anthropic Claude 3 Sonnet",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
		provider: "aws"
	},
	"anthropic.claude-3-haiku-20240307-v1:0": {
		id: "anthropic.claude-3-haiku-20240307-v1:0",
		name: "Anthropic Claude 3 Haiku",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0.25,
		outputPrice: 1.25,
		provider: "aws"
	},
	"deepseek.r1-v1:0": {
		id: "deepseek.r1-v1:0",
		name: "DeepSeek R1",
		contextLength: 64000,
		maxTokens: 8_000,
		contextWindow: 64_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 1.35,
		outputPrice: 5.4,
		provider: "aws"
	},
} as const satisfies Record<string, ModelInfo>

// OpenRouter
// https://openrouter.ai/models?order=newest&supported_parameters=tools
export type OpenRouterModelId = "openai/gpt-4-turbo-preview" | "anthropic/claude-3-opus-20240229"
export const openRouterDefaultModelId: OpenRouterModelId = "openai/gpt-4-turbo-preview"
export const openRouterDefaultModelInfo: ModelInfo = {
	id: "openai/gpt-4-turbo-preview",
	name: "OpenAI GPT-4 Turbo Preview",
	contextLength: 200000,
	maxTokens: 8192,
	contextWindow: 200_000,
	supportsImages: true,
	supportsComputerUse: true,
	supportsPromptCache: true,
	inputPrice: 3.0,
	outputPrice: 15.0,
	cacheWritesPrice: 3.75,
	cacheReadsPrice: 0.3,
	description:
		"Claude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. It introduces a hybrid reasoning approach, allowing users to choose between rapid responses and extended, step-by-step processing for complex tasks. The model demonstrates notable improvements in coding, particularly in front-end development and full-stack updates, and excels in agentic workflows, where it can autonomously navigate multi-step processes. \n\nClaude 3.7 Sonnet maintains performance parity with its predecessor in standard mode while offering an extended reasoning mode for enhanced accuracy in math, coding, and instruction-following tasks.\n\nRead more at the [blog post here](https://www.anthropic.com/news/claude-3-7-sonnet)",
	provider: "openrouter"
}
// Vertex AI
// https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude
// https://cloud.google.com/vertex-ai/generative-ai/pricing#partner-models
export type VertexModelId = keyof typeof vertexModels
export const vertexDefaultModelId: VertexModelId = "claude-3-7-sonnet@20250219"
export const vertexModels = {
	"claude-3-7-sonnet@20250219": {
		id: "claude-3-7-sonnet@20250219",
		name: "Claude 3.7 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		provider: "vertex"
	},
	"claude-3-5-sonnet-v2@20241022": {
		id: "claude-3-5-sonnet-v2@20241022",
		name: "Claude 3.5 Sonnet v2",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		provider: "vertex"
	},
	"claude-3-5-sonnet@20240620": {
		id: "claude-3-5-sonnet@20240620",
		name: "Claude 3.5 Sonnet",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
		provider: "vertex"
	},
	"claude-3-5-haiku@20241022": {
		id: "claude-3-5-haiku@20241022",
		name: "Claude 3.5 Haiku",
		contextLength: 200000,
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 1.0,
		outputPrice: 5.0,
		cacheWritesPrice: 1.25,
		cacheReadsPrice: 0.1,
		provider: "vertex"
	},
	"claude-3-opus@20240229": {
		id: "claude-3-opus@20240229",
		name: "Claude 3 Opus",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 15.0,
		outputPrice: 75.0,
		cacheWritesPrice: 18.75,
		cacheReadsPrice: 1.5,
		provider: "vertex"
	},
	"claude-3-haiku@20240307": {
		id: "claude-3-haiku@20240307",
		name: "Claude 3 Haiku",
		contextLength: 200000,
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0.25,
		outputPrice: 1.25,
		cacheWritesPrice: 0.3,
		cacheReadsPrice: 0.03,
		provider: "vertex"
	},
	"gemini-2.0-flash-001": {
		id: "gemini-2.0-flash-001",
		name: "Gemini 2.0 Flash",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-thinking-exp-1219": {
		id: "gemini-2.0-flash-thinking-exp-1219",
		name: "Gemini 2.0 Flash Thinking Experimental",
		contextLength: 32767,
		maxTokens: 8192,
		contextWindow: 32_767,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-exp": {
		id: "gemini-2.0-flash-exp",
		name: "Gemini 2.0 Flash Experimental",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.5-pro-exp-03-25": {
		id: "gemini-2.5-pro-exp-03-25",
		name: "Gemini 2.5 Pro Experimental",
		contextLength: 1048576,
		maxTokens: 65536,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-thinking-exp-01-21": {
		id: "gemini-2.0-flash-thinking-exp-01-21",
		name: "Gemini 2.0 Flash Thinking Experimental",
		contextLength: 1048576,
		maxTokens: 65_536,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-exp-1206": {
		id: "gemini-exp-1206",
		name: "Gemini Experimental",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-flash-002": {
		id: "gemini-1.5-flash-002",
		name: "Gemini 1.5 Flash",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-flash-exp-0827": {
		id: "gemini-1.5-flash-exp-0827",
		name: "Gemini 1.5 Flash Experimental",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-flash-8b-exp-0827": {
		id: "gemini-1.5-flash-8b-exp-0827",
		name: "Gemini 1.5 Flash 8B Experimental",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-pro-002": {
		id: "gemini-1.5-pro-002",
		name: "Gemini 1.5 Pro",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-pro-exp-0827": {
		id: "gemini-1.5-pro-exp-0827",
		name: "Gemini 1.5 Pro Experimental",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
} as const satisfies Record<string, ModelInfo>

export const openAiModelInfoSaneDefaults: ModelInfo = {
	id: "default-openai-model",
	name: "Default OpenAI Model",
	contextLength: 8192,
	maxTokens: -1,
	contextWindow: 8192,
	supportsImages: false,
	supportsPromptCache: false,
	inputPrice: 0,
	outputPrice: 0,
	description: "Default model info",
	provider: "openrouter"
};

// Gemini
// https://ai.google.dev/gemini-api/docs/models/gemini
export type GeminiModelId = keyof typeof geminiModels
export const geminiDefaultModelId: GeminiModelId = "gemini-2.0-flash-001"
export const geminiModels = {
	"gemini-2.5-pro-exp-03-25": {
		id: "gemini-2.5-pro-exp-03-25",
		name: "Gemini 2.5 Pro Experimental",
		contextLength: 1048576,
		maxTokens: 65536,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-001": {
		id: "gemini-2.0-flash-001",
		name: "Gemini 2.0 Flash",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-lite-preview-02-05": {
		id: "gemini-2.0-flash-lite-preview-02-05",
		name: "Gemini 2.0 Flash Lite Preview",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-pro-exp-02-05": {
		id: "gemini-2.0-pro-exp-02-05",
		name: "Gemini 2.0 Pro Experimental",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-thinking-exp-01-21": {
		id: "gemini-2.0-flash-thinking-exp-01-21",
		name: "Gemini 2.0 Flash Thinking Experimental",
		contextLength: 1048576,
		maxTokens: 65536,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-thinking-exp-1219": {
		id: "gemini-2.0-flash-thinking-exp-1219",
		name: "Gemini 2.0 Flash Thinking Experimental",
		contextLength: 32767,
		maxTokens: 8192,
		contextWindow: 32_767,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-2.0-flash-exp": {
		id: "gemini-2.0-flash-exp",
		name: "Gemini 2.0 Flash Experimental",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-flash-002": {
		id: "gemini-1.5-flash-002",
		name: "Gemini 1.5 Flash",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-flash-exp-0827": {
		id: "gemini-1.5-flash-exp-0827",
		name: "Gemini 1.5 Flash Experimental",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-flash-8b-exp-0827": {
		id: "gemini-1.5-flash-8b-exp-0827",
		name: "Gemini 1.5 Flash 8B Experimental",
		contextLength: 1048576,
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-pro-002": {
		id: "gemini-1.5-pro-002",
		name: "Gemini 1.5 Pro",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-1.5-pro-exp-0827": {
		id: "gemini-1.5-pro-exp-0827",
		name: "Gemini 1.5 Pro Experimental",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
	"gemini-exp-1206": {
		id: "gemini-exp-1206",
		name: "Gemini Experimental",
		contextLength: 2097152,
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "vertex"
	},
} as const satisfies Record<string, ModelInfo>

// OpenAI Native
// https://openai.com/api/pricing/
export type OpenAiNativeModelId = keyof typeof openAiNativeModels
export const openAiNativeDefaultModelId: OpenAiNativeModelId = "gpt-4o"
export const openAiNativeModels = {
	"o3-mini": {
		id: "o3-mini",
		name: "O3 Mini",
		contextLength: 200000,
		maxTokens: 100_000,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 1.1,
		outputPrice: 4.4,
		cacheReadsPrice: 0.55,
		provider: "openrouter"
	},
	// don't support tool use yet
	o1: {
		id: "o1",
		name: "O1",
		contextLength: 200000,
		maxTokens: 100_000,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 15,
		outputPrice: 60,
		cacheReadsPrice: 7.5,
		provider: "openrouter"
	},
	"o1-preview": {
		id: "o1-preview",
		name: "O1 Preview",
		contextLength: 128000,
		maxTokens: 32_768,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 15,
		outputPrice: 60,
		cacheReadsPrice: 7.5,
		provider: "openrouter"
	},
	"o1-mini": {
		id: "o1-mini",
		name: "O1 Mini",
		contextLength: 128000,
		maxTokens: 65_536,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 1.1,
		outputPrice: 4.4,
		cacheReadsPrice: 0.55,
		provider: "openrouter"
	},
	"gpt-4o": {
		id: "gpt-4o",
		name: "GPT-4o",
		contextLength: 128000,
		maxTokens: 4_096,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 2.5,
		outputPrice: 10,
		cacheReadsPrice: 1.25,
		provider: "openrouter"
	},
	"gpt-4o-mini": {
		id: "gpt-4o-mini",
		name: "GPT-4o Mini",
		contextLength: 128000,
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0.15,
		outputPrice: 0.6,
		cacheReadsPrice: 0.075,
		provider: "openrouter"
	},
	"chatgpt-4o-latest": {
		id: "chatgpt-4o-latest",
		name: "ChatGPT-4o Latest",
		contextLength: 128000,
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 5,
		outputPrice: 15,
		provider: "openrouter"
	},
	"gpt-4.5-preview": {
		id: "gpt-4.5-preview",
		name: "GPT-4.5 Preview",
		contextLength: 128000,
		maxTokens: 16_384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 75,
		outputPrice: 150,
		provider: "openrouter"
	},
} as const satisfies Record<string, ModelInfo>

// Azure OpenAI
// https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
export const azureOpenAiDefaultApiVersion = "2024-08-01-preview"

// DeepSeek
// https://api-docs.deepseek.com/quick_start/pricing
export type DeepSeekModelId = keyof typeof deepSeekModels
export const deepSeekDefaultModelId: DeepSeekModelId = "deepseek-chat"
export const deepSeekModels = {
	"deepseek-chat": {
		id: "deepseek-chat",
		name: "DeepSeek Chat",
		contextLength: 64000,
		maxTokens: 8_000,
		contextWindow: 64_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.27,
		outputPrice: 1.1,
		cacheWritesPrice: 0.27,
		cacheReadsPrice: 0.07,
		provider: "deepseek"
	},
	"deepseek-reasoner": {
		id: "deepseek-reasoner",
		name: "DeepSeek Reasoner",
		contextLength: 64000,
		maxTokens: 8_000,
		contextWindow: 64_000,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.55,
		outputPrice: 2.19,
		cacheWritesPrice: 0.55,
		cacheReadsPrice: 0.14,
		provider: "deepseek"
	},
} as const satisfies Record<string, ModelInfo>

// Qwen
export type MainlandQwenModelId = "qwen-turbo"
export type InternationalQwenModelId = "qwen-coder-plus-latest"
export type QwenModelId = MainlandQwenModelId | InternationalQwenModelId
export const qwenDefaultModelId: QwenModelId = "qwen-turbo"
export const qwenModels: Record<QwenModelId, OpenAiCompatibleModelInfo> = {
	"qwen-turbo": {
		id: "qwen-turbo",
		name: "Qwen Turbo",
		description: "Fast and efficient model for general tasks",
		maxTokens: -1,
		contextWindow: 8192,
		contextLength: 8192,
		temperature: 0.7,
		provider: "qwen",
		inputPrice: 0.001,
		outputPrice: 0.002,
		supportsPromptCache: false,
		supportsTools: true,
		supportsVision: false
	},
	"qwen-coder-plus-latest": {
		id: "qwen-coder-plus-latest",
		name: "Qwen Coder Plus",
		description: "Specialized model for code generation and analysis",
		maxTokens: -1,
		contextWindow: 8192,
		contextLength: 8192,
		temperature: 0.7,
		provider: "qwen",
		inputPrice: 0.002,
		outputPrice: 0.004,
		supportsPromptCache: false,
		supportsTools: true,
		supportsVision: false
	},
}

// Mistral
// https://docs.mistral.ai/getting-started/models/models_overview/
export type MistralModelId = keyof typeof mistralModels
export const mistralDefaultModelId: MistralModelId = "codestral-2501"
export const mistralModels = {
	"mistral-large-2411": {
		id: "mistral-large-2411",
		name: "Mistral Large 2411",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 6,
		provider: "mistral"
	},
	"pixtral-large-2411": {
		id: "pixtral-large-2411", 
		name: "Pixtral Large 2411",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 6,
		provider: "mistral"
	},
	"ministral-3b-2410": {
		id: "ministral-3b-2410",
		name: "Ministral 3B 2410",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.04,
		outputPrice: 0.04,
		provider: "mistral"
	},
	"ministral-8b-2410": {
		id: "ministral-8b-2410",
		name: "Ministral 8B 2410",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.1,
		outputPrice: 0.1,
		provider: "mistral"
	},
	"mistral-small-latest": {
		id: "mistral-small-latest",
		name: "Mistral Small Latest",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0.2,
		outputPrice: 0.6,
		provider: "mistral"
	},
	"mistral-medium-latest": {
		id: "mistral-medium-latest",
		name: "Mistral Medium Latest",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0.7,
		outputPrice: 2.1,
		provider: "mistral"
	},
	"mistral-large-latest": {
		id: "mistral-large-latest",
		name: "Mistral Large Latest",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 6,
		provider: "mistral"
	},
	"codestral-2501": {
		id: "codestral-2501",
		name: "Codestral 2501",
		contextLength: 131000,
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.2,
		outputPrice: 0.6,
		provider: "mistral"
	},
} as const satisfies Record<string, ModelInfo>

// Aggiungo le costanti mancanti per Mistral
export const mistralChatProModels = {
	"mistral-large-2411": mistralModels["mistral-large-2411"],
	"pixtral-large-2411": mistralModels["pixtral-large-2411"],
	"mistral-large-latest": mistralModels["mistral-large-latest"],
}

export const mistralSmallModels = {
	"mistral-small-latest": mistralModels["mistral-small-latest"],
	"ministral-3b-2410": mistralModels["ministral-3b-2410"],
	"ministral-8b-2410": mistralModels["ministral-8b-2410"],
	"codestral-2501": mistralModels["codestral-2501"],
}

// LiteLLM
// https://docs.litellm.ai/docs/
export type LiteLLMModelId = string
export const liteLlmDefaultModelId = "gpt-3.5-turbo"
export const liteLlmModelInfoSaneDefaults: ModelInfo = {
	id: "litellm-default",
	name: "LiteLLM Default Model",
	contextLength: 8192,
	maxTokens: 8192,
	contextWindow: 8192,
	supportsImages: true,
	supportsPromptCache: false,
	inputPrice: 0,
	outputPrice: 0,
	provider: "openrouter"
};

// AskSage Models
// https://docs.asksage.ai/
export type AskSageModelId = keyof typeof askSageModels
export const askSageDefaultModelId: AskSageModelId = "claude-35-sonnet"
export const askSageDefaultURL: string = "https://api.asksage.ai/server"
export const askSageModels = {
	"gpt-4o": {
		maxTokens: 4096,
		contextWindow: 128_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "openrouter"
	},
	"gpt-4o-gov": {
		maxTokens: 4096,
		contextWindow: 128_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "openrouter"
	},
	"claude-35-sonnet": {
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "openrouter"
	},
	"aws-bedrock-claude-35-sonnet-gov": {
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "openrouter"
	},
	"claude-37-sonnet": {
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "openrouter"
	},
}

// X AI
// https://docs.x.ai/docs/api-reference
export type XAIModelId = keyof typeof xaiModels
export const xaiDefaultModelId: XAIModelId = "grok-2-latest"
export const xaiModels = {
	"grok-2-latest": {
		id: "grok-2-latest",
		name: "Grok 2 Latest",
		contextLength: 131072,
		maxTokens: 8192,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 10,
		description: "X AI's Grok-2 model - latest version with 131K context window",
		provider: "xai"
	},
	"grok-2": {
		id: "grok-2",
		name: "Grok 2",
		contextLength: 131072,
		maxTokens: 8192,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 10,
		description: "X AI's Grok-2 model with 131K context window",
		provider: "xai"
	},
	"grok-2-1212": {
		id: "grok-2-1212",
		name: "Grok 2 (1212)",
		contextLength: 131072,
		maxTokens: 8192,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 10,
		description: "X AI's Grok-2 model (version 1212) with 131K context window",
		provider: "xai"
	},
	"grok-2-vision-latest": {
		id: "grok-2-vision-latest",
		name: "Grok 2 Vision Latest",
		contextLength: 32768,
		maxTokens: 8192,
		contextWindow: 32768,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 10,
		description: "X AI's Grok-2 Vision model - latest version with image support and 32K context window",
		provider: "xai"
	},
	"grok-2-vision": {
		id: "grok-2-vision",
		name: "Grok 2 Vision",
		contextLength: 32768,
		maxTokens: 8192,
		contextWindow: 32768,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 10,
		description: "X AI's Grok-2 Vision model with image support and 32K context window",
		provider: "xai"
	},
	"grok-2-vision-1212": {
		id: "grok-2-vision-1212",
		name: "Grok 2 Vision (1212)",
		contextLength: 32768,
		maxTokens: 8192,
		contextWindow: 32768,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 2,
		outputPrice: 10,
		description: "X AI's Grok-2 Vision model (version 1212) with image support and 32K context window",
		provider: "xai"
	},
	"grok-vision-beta": {
		id: "grok-vision-beta",
		name: "Grok Vision Beta",
		contextLength: 8192,
		maxTokens: 8192,
		contextWindow: 8192,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 5,
		outputPrice: 15,
		description: "X AI's Grok Vision Beta model with image support and 8K context window",
		provider: "xai"
	},
	"grok-beta": {
		id: "grok-beta",
		name: "Grok Beta",
		contextLength: 131072,
		maxTokens: 8192,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 5,
		outputPrice: 15,
		description: "X AI's Grok Beta model (legacy) with 131K context window",
		provider: "xai"
	},
} as const satisfies Record<string, ModelInfo>

// SambaNova
// https://docs.sambanova.ai/cloud/docs/get-started/supported-models
export type SambanovaModelId = keyof typeof sambanovaModels
export const sambanovaDefaultModelId: SambanovaModelId = "Meta-Llama-3.3-70B-Instruct"
export const sambanovaModels = {
	"Meta-Llama-3.3-70B-Instruct": {
		id: "Meta-Llama-3.3-70B-Instruct",
		name: "Meta Llama 3.3 70B Instruct",
		contextLength: 128000,
		maxTokens: 4096,
		contextWindow: 128000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"DeepSeek-R1-Distill-Llama-70B": {
		id: "DeepSeek-R1-Distill-Llama-70B",
		name: "DeepSeek R1 Distill Llama 70B",
		contextLength: 32000,
		maxTokens: 4096,
		contextWindow: 32000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Llama-3.1-Swallow-70B-Instruct-v0.3": {
		id: "Llama-3.1-Swallow-70B-Instruct-v0.3",
		name: "Llama 3.1 Swallow 70B Instruct v0.3",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Llama-3.1-Swallow-8B-Instruct-v0.3": {
		id: "Llama-3.1-Swallow-8B-Instruct-v0.3",
		name: "Llama 3.1 Swallow 8B Instruct v0.3",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Meta-Llama-3.1-405B-Instruct": {
		id: "Meta-Llama-3.1-405B-Instruct",
		name: "Meta Llama 3.1 405B Instruct",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Meta-Llama-3.1-8B-Instruct": {
		id: "Meta-Llama-3.1-8B-Instruct",
		name: "Meta Llama 3.1 8B Instruct",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Meta-Llama-3.2-1B-Instruct": {
		id: "Meta-Llama-3.2-1B-Instruct",
		name: "Meta Llama 3.2 1B Instruct",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Qwen2.5-72B-Instruct": {
		id: "Qwen2.5-72B-Instruct",
		name: "Qwen 2.5 72B Instruct",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"Qwen2.5-Coder-32B-Instruct": {
		id: "Qwen2.5-Coder-32B-Instruct",
		name: "Qwen 2.5 Coder 32B Instruct",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"QwQ-32B-Preview": {
		id: "QwQ-32B-Preview",
		name: "QwQ 32B Preview",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		provider: "sambanova"
	},
	"QwQ-32B": {
		id: "QwQ-32B",
		name: "QwQ 32B",
		contextLength: 16000,
		maxTokens: 4096,
		contextWindow: 16000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.5,
		outputPrice: 1,
		provider: "sambanova"
	},
	"DeepSeek-V3-0324": {
		id: "DeepSeek-V3-0324",
		name: "DeepSeek V3 0324",
		contextLength: 8192,
		maxTokens: 4096,
		contextWindow: 8192,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 1,
		outputPrice: 1.5,
		provider: "sambanova"
	},
} as const satisfies Record<string, ModelInfo>

export const zeroHumanEvalInfo = (modelId: string): ModelInfo => ({
	id: modelId,
	name: `ZeroHumanEval ${modelId}`,
	contextLength: 8192,
	maxTokens: 8192,
	contextWindow: 8192,
	supportsImages: false,
	supportsPromptCache: false,
	inputPrice: 0,
	outputPrice: 0,
	description: "Zero HumanEval model for benchmarking",
	provider: "openrouter"
});

export const googleModels = {
	"gemini-pro": {
		id: "gemini-pro",
		name: "Gemini Pro",
		contextLength: 300000,
		maxTokens: 5000,
		contextWindow: 300000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.8,
		outputPrice: 3.2,
		provider: "gemini"
	},
	
	"gemini-flash": {
		id: "gemini-flash",
		name: "Gemini Flash",
		contextLength: 300000,
		maxTokens: 5000,
		contextWindow: 300000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.06,
		outputPrice: 0.24,
		provider: "gemini"
	},
	
	"gemini-1.0-pro": {
		id: "gemini-1.0-pro",
		name: "Gemini 1.0 Pro",
		contextLength: 128000,
		maxTokens: 5000,
		contextWindow: 128000,
		supportsImages: false,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.035,
		outputPrice: 0.14,
		provider: "gemini"
	}
} as const satisfies Record<string, ModelInfo>
