import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI, { ChatCompletionMessageParam, CompletionUsage } from "openai"
import { ApiHandler } from "../index.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js"
import { openAiModelInfoSaneDefaults } from "../../shared/api.js"
import { convertToOpenAiMessages } from "../transform/openai-format.js"
import { ApiStream } from "../transform/stream.js"

export class RequestyHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: "https://router.requesty.ai/v1",
			apiKey: this.options.requestyApiKey,
			defaultHeaders: {
				"HTTP-Referer": "https://jarvis-ide.com",
				"X-Title": "Jarvis IDE",
			},
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const maxRetries = 2
		const retryDelay = 500
		let attempt = 0
		
		while (true) {
			try {
				attempt++
				const modelId = this.options.requestyModelId ?? ""

				let openAiMessages: ChatCompletionMessageParam[] = [
					{ role: "system", content: systemPrompt },
					...convertToOpenAiMessages(messages),
				]

				// @ts-ignore-next-line
				const stream = await this.client.chat.completions.create({
					model: modelId,
					messages: openAiMessages,
					temperature: 0,
					stream: true,
					stream_options: { include_usage: true },
					...(modelId === "openai/o3-mini" ? { reasoning_effort: this.options.o3MiniReasoningEffort || "medium" } : {}),
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

					// Requesty usage includes an extra field for Anthropic use cases.
					// Safely cast the prompt token details section to the appropriate structure.
					interface RequestyUsage extends CompletionUsage {
						prompt_tokens_details?: {
							caching_tokens?: number
							cached_tokens?: number
						}
						total_cost?: number
					}

					if (chunk.usage) {
						const usage = chunk.usage as RequestyUsage
						const inputTokens = usage.prompt_tokens || 0
						const outputTokens = usage.completion_tokens || 0
						const cacheWriteTokens = usage.prompt_tokens_details?.caching_tokens || undefined
						const cacheReadTokens = usage.prompt_tokens_details?.cached_tokens || undefined
						const totalCost = 0 // TODO: Replace with calculateApiCostOpenAI(model.info, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens)

						yield {
							type: "usage",
							inputTokens: inputTokens,
							outputTokens: outputTokens,
							cacheWriteTokens: cacheWriteTokens,
							cacheReadTokens: cacheReadTokens,
							totalCost: totalCost,
						}
					}
				}
				break // Se arriviamo qui, il metodo è riuscito e usciamo dal ciclo
			} catch (error) {
				console.error(`[requesty] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error)
				if (attempt > maxRetries) {
					console.error(`[requesty] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`, error)
					throw error
				}
				await new Promise(resolve => setTimeout(resolve, retryDelay))
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.requestyModelId ?? "",
			info: openAiModelInfoSaneDefaults,
		}
	}
}
