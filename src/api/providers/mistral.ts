import { Anthropic } from "@anthropic-ai/sdk"
import { MistralClient } from "@mistralai/mistralai"
import type { ApiHandler } from "../index.js.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js.js"
import { calculateApiCostOpenAI } from "../../utils/cost.js.js"
import type { convertToOpenAiMessages } from "../transform/openai-format.js.js"
import { ApiStream, ApiStreamChunk } from "../transform/stream.js.js"
import { convertToR1Format } from "../transform/r1-format.js.js"
import type { BaseStreamHandler } from "../handlers/BaseStreamHandler.js.js"
import { logger } from "../../utils/logger.js.js"
import type {
	mistralDefaultModelId,
	MistralModelId,
	mistralModels,
	mistralChatProModels,
	mistralSmallModels,
	openAiNativeDefaultModelId,
	OpenAiNativeModelId,
	openAiNativeModels,
} from "../../shared/api.js.js"
import type { convertToMistralMessages } from "../transform/mistral-format.js.js"

interface MistralUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

interface MistralStreamChunk {
	data?: {
		choices?: Array<{
			delta?: {
				content?: string | Array<{ type: string; text: string }>;
			};
		}>;
		usage?: MistralUsage;
	};
}

export class MistralHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: MistralClient

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new MistralClient({
			apiKey: this.options.mistralApiKey,
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const maxRetries = 2
		const retryDelay = 500
		let attempt = 0
		
		while (true) {
			try {
				attempt++
				const stream = await this.client.chat.stream({
					model: this.getModel().id,
					temperature: 0,
					messages: [{ role: "system", content: systemPrompt }, ...convertToMistralMessages(messages)],
					stream: true,
				})

				for await (const chunk of stream) {
					const mistralChunk = chunk as MistralStreamChunk
					
					if (mistralChunk?.data?.choices && Array.isArray(mistralChunk.data.choices) && mistralChunk.data.choices.length > 0) {
						const delta = mistralChunk.data.choices[0]?.delta ?? {}
						
						if (delta && 'content' in delta && delta.content) {
							let content: string = ""
							if (typeof delta.content === "string") {
								content = delta.content
							} else if (Array.isArray(delta.content)) {
								content = delta.content
									.filter(c => c && typeof c === 'object' && 'type' in c && c.type === "text" && 'text' in c)
									.map(c => (c.type === "text" ? c.text : ""))
									.join("")
							}
							
							if (content) {
								yield {
									type: "text",
									text: content,
								}
							}
						}
					}

					if (mistralChunk?.data?.usage) {
						const mistralUsage = mistralChunk.data.usage
						yield {
							type: "usage",
							inputTokens: mistralUsage.prompt_tokens || 0,
							outputTokens: mistralUsage.completion_tokens || 0,
						}
					}
				}
				break
			} catch (error) {
				logger.error(`[MistralHandler] Tentativo ${attempt}/${maxRetries + 1} fallito: ${error instanceof Error ? error.message : String(error)}`)
				if (attempt > maxRetries) {
					logger.error(`[MistralHandler] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore: ${error instanceof Error ? error.message : String(error)}`)
					throw error
				}
				await new Promise(resolve => setTimeout(resolve, retryDelay))
			}
		}
	}

	getModel(): { id: MistralModelId; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in mistralModels) {
			const id = modelId as MistralModelId
			return { id, info: mistralModels[id] }
		}
		return {
			id: mistralDefaultModelId,
			info: mistralModels[mistralDefaultModelId],
		}
	}
}
