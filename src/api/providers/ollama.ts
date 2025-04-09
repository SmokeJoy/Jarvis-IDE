import type { Message, Ollama } from "ollama"
import type { ApiHandler } from "../index.js.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js.js"
import type { openAiModelInfoSaneDefaults } from "../../shared/api.js.js"
import type { convertToOllamaMessages } from "../transform/ollama-format.js.js"
import { ApiStream } from "../transform/stream.js.js"
import type { ChatMessage } from "../../types/chat.types.js.js"

export class OllamaHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: Ollama

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new Ollama({ host: this.options.ollamaBaseUrl || "http://localhost:11434" })
	}

	async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
		const ollamaMessages: Message[] = [{ role: "system", content: systemPrompt }, ...convertToOllamaMessages(messages)]

		const stream = await this.client.chat({
			model: this.getModel().id,
			messages: ollamaMessages,
			stream: true,
			options: {
				num_ctx: Number(this.options.ollamaApiOptionsCtxNum) || 32768,
			},
		})
		for await (const chunk of stream) {
			if (typeof chunk.message.content === "string") {
				yield {
					type: "text",
					text: chunk.message.content,
				}
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.ollamaModelId || "",
			info: openAiModelInfoSaneDefaults,
		}
	}
}
