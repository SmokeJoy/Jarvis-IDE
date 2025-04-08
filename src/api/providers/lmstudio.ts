import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI, { ChatCompletionMessageParam } from "openai"
import { ApiHandler } from "../index.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js"
import { openAiModelInfoSaneDefaults } from "../../shared/api.js"
import { convertToOpenAiMessages } from "../transform/openai-format.js"
import { ApiStream } from "../transform/stream.js"
import { logger } from "../../utils/logger.js"

export class LmStudioHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: (this.options.lmStudioBaseUrl || "http://localhost:1234") + "/v1",
			apiKey: "noop",
		})
		logger.debug(`[LmStudioHandler] Inizializzato con baseURL: ${this.options.lmStudioBaseUrl || "http://localhost:1234"}`)
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const openAiMessages: ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		logger.info(`[LmStudioHandler] Inizio chiamata API LM Studio con modello: ${this.getModel().id}`)
		
		try {
			const stream = await this.client.chat.completions.create({
				model: this.getModel().id,
				messages: openAiMessages,
				temperature: 0,
				stream: true,
			})
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta
				if (delta?.content) {
					yield {
						type: "text",
						text: delta.content,
					}
				}
			}
		} catch (error) {
			logger.error(`[LmStudioHandler] Errore durante la chiamata API: ${error instanceof Error ? error.message : String(error)}`)
			// LM Studio doesn't return an error code/body for now
			throw new Error(
				"Please check the LM Studio developer logs to debug what went wrong. You may need to load the model with a larger context length to work with Jarvis IDE's prompts.",
			)
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.lmStudioModelId || "",
			info: openAiModelInfoSaneDefaults,
		}
	}
}
