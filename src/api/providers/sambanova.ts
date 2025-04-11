import OpenAI from "openai"
import { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js"
import { SambanovaModelId, sambanovaDefaultModelId, sambanovaModels } from "../../shared/api.js"
import { ApiHandler } from "../index.js"
import { convertToOpenAiMessages } from "../transform/openai-format.js"
import { ApiStream } from "../transform/stream.js"
import { convertToR1Format } from "../transform/r1-format.js"
import { ChatMessage } from "../../types/chat.types.js"
import { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js"

export class SambanovaHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: "https://api.sambanova.ai/v1",
			apiKey: this.options.sambanovaApiKey,
		})
	}

	async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
		const maxRetries = 2
		const retryDelay = 500
		let attempt = 0
		
		while (true) {
			try {
				attempt++
				const model = this.getModel()

				let openAiMessages: ChatCompletionMessageParam[] = [
					{ role: "system", content: systemPrompt },
					...convertToOpenAiMessages(messages),
				]

				const modelId = model.id.toLowerCase()

				if (modelId.includes("deepseek") || modelId.includes("qwen") || modelId.includes("qwq")) {
					openAiMessages = convertToR1Format([{ role: "user", content: systemPrompt }, ...messages])
				}

				const stream = await this.client.chat.completions.create({
					model: this.getModel().id,
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
				console.error(`[sambanova] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error)
				if (attempt > maxRetries) {
					console.error(`[sambanova] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`, error)
					throw error
				}
				await new Promise(resolve => setTimeout(resolve, retryDelay))
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in sambanovaModels) {
			const id = modelId as SambanovaModelId
			return { id, info: sambanovaModels[id] }
		}
		return {
			id: sambanovaDefaultModelId,
			info: sambanovaModels[sambanovaDefaultModelId],
		}
	}
}
