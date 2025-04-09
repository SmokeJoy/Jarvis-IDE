import OpenAI from "openai"
import type { ApiHandler } from "../index.js.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js.js"
import type { openAiModelInfoSaneDefaults } from "../../shared/api.js.js"
import { calculateApiCostOpenAI } from "../../utils/cost.js.js"
import type { convertToOpenAiMessages } from "../transform/openai-format.js.js"
import { ApiStream, ApiStreamChunk } from "../transform/stream.js.js"
import { convertToR1Format } from "../transform/r1-format.js.js"
import type { BaseStreamHandler } from "../handlers/BaseStreamHandler.js.js"
import { logger } from "../../utils/logger.js.js"
import type { ChatMessage } from "../../types/chat.types.js.js"
import type { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js.js"

export class TogetherHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: "https://api.together.xyz/v1",
			apiKey: this.options.togetherApiKey,
		})
	}

	async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
		const maxRetries = 2
		const retryDelay = 500
		let attempt = 0
		
		while (true) {
			try {
				attempt++
				const modelId = this.options.togetherModelId ?? ""
				const isDeepseekReasoner = modelId.includes("deepseek-reasoner")

				let openAiMessages: ChatCompletionMessageParam[] = [
					{ role: "system", content: systemPrompt },
					...convertToOpenAiMessages(messages),
				]

				if (isDeepseekReasoner) {
					openAiMessages = convertToR1Format([{ role: "user", content: systemPrompt }, ...messages])
				}

				const stream = await this.client.chat.completions.create({
					model: modelId,
					messages: openAiMessages,
					temperature: 0,
					stream: true,
					stream_options: { include_usage: true },
				})
				for await (const chunk of stream) {
					const delta = chunk.choices[0]?.delta
					if (delta?.content) {
						yield {
							type: "text",
							text: delta.content,
						}
					}

					if (delta && "reasoning_content" in delta && delta.reasoning_content) {
						yield {
							type: "reasoning",
							reasoning: (delta.reasoning_content as string | undefined) || "",
						}
					}

					if (chunk.usage) {
						yield {
							type: "usage",
							inputTokens: chunk.usage.prompt_tokens || 0,
							outputTokens: chunk.usage.completion_tokens || 0,
						}
					}
				}
				break // Se arriviamo qui, il metodo è riuscito e usciamo dal ciclo
			} catch (error) {
				console.error(`[together] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error)
				if (attempt > maxRetries) {
					console.error(`[together] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`, error)
					throw error
				}
				await new Promise(resolve => setTimeout(resolve, retryDelay))
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.togetherModelId ?? "",
			info: openAiModelInfoSaneDefaults,
		}
	}
}
