import { GoogleGenerativeAI } from "@google/generative-ai"
import type { ApiHandler } from "../index.js.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js.js"
import type { ChatMessage } from "../../types/chat.types.js.js"
import { ApiStream, ApiStreamChunk } from "../transform/stream.js.js"
import type { BaseStreamHandler } from "../handlers/BaseStreamHandler.js.js"
import { logger } from "../../utils/logger.js.js"
import type { 
	geminiDefaultModelId, 
	GeminiModelId, 
	geminiModels 
} from "../../shared/api.ts"
import type { convertAnthropicMessageToGemini, convertMessageToGemini } from "../transform/gemini-format.js.js"

export class GeminiHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: GoogleGenerativeAI

	constructor(options: ApiHandlerOptions) {
		if (!options.geminiApiKey) {
			throw new Error("API key is required for Google Gemini")
		}
		this.options = options
		this.client = new GoogleGenerativeAI(options.geminiApiKey)
	}

	async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
		const retries = 2
		const delay = 500
		let attempt = 0
		
		while (attempt <= retries) {
			try {
				const model = this.client.getGenerativeModel({
					model: this.getModel().id,
					systemInstruction: systemPrompt,
				})
				const result = await model.generateContentStream({
					contents: messages.map(convertMessageToGemini),
					generationConfig: {
						// maxOutputTokens: this.getModel().info.maxTokens,
						temperature: 0,
					},
				})

				for await (const chunk of result.stream) {
					yield {
						type: "text",
						text: chunk.text(),
					}
				}

				const response = await result.response
				yield {
					type: "usage",
					inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
					outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
				}
				
				return
			} catch (error) {
				attempt++
				if (attempt > retries) {
					console.error(`[gemini] Errore definitivo dopo ${retries} tentativi:`, error)
					throw error
				}
				console.warn(`[gemini] Tentativo ${attempt} fallito, nuovo tentativo tra ${delay}ms...`)
				await new Promise((res) => setTimeout(res, delay))
			}
		}
	}

	getModel(): { id: GeminiModelId; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in geminiModels) {
			const id = modelId as GeminiModelId
			return { id, info: geminiModels[id] }
		}
		return {
			id: geminiDefaultModelId,
			info: geminiModels[geminiDefaultModelId],
		}
	}
}
