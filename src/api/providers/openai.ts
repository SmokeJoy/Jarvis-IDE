import OpenAI, { AzureOpenAI } from "openai"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js"
import type { 
	ChatCompletionChunk, 
	ChatCompletionMessageParam, 
	Stream 
} from "../../types/provider-types/openai-types.js"
import { Anthropic } from "@anthropic-ai/sdk"
import type { azureOpenAiDefaultApiVersion, openAiModelInfoSaneDefaults } from "../../shared/api.js"
import type { ApiHandler } from "../index.js"
import type { convertToOpenAiMessages } from "../transform/openai-format.js"
import { ApiStream, ApiStreamChunk } from "../transform/stream.js"
import { convertToR1Format } from "../transform/r1-format.js"
import type { BaseStreamHandler } from "../handlers/BaseStreamHandler.js"
import { logger } from "../../utils/logger.js"
import { calculateApiCostOpenAI } from "../../utils/cost.js"
import type { getOpenAiConfig } from "./config/openai-config.js"

interface OpenAiUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

interface OpenAiStreamChunk {
	choices?: Array<{
		delta?: {
			content?: string;
			reasoning_content?: string;
		};
	}>;
	usage?: OpenAiUsage;
}

/**
 * Handler per l'API OpenAI che estende BaseStreamHandler
 * per sfruttare la logica comune di streaming e retry
 */
export class OpenAiHandler extends BaseStreamHandler<ChatCompletionChunk> implements ApiHandler {
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		super(options)
		
		// Azure API shape slightly differs from the core API shape: https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai
		// Use azureApiVersion to determine if this is an Azure endpoint, since the URL may not always contain 'azure.com'
		if (this.options.azureApiVersion || this.options.openAiBaseUrl?.toLowerCase().includes("azure.com")) {
			this.client = new AzureOpenAI({
				baseURL: this.options.openAiBaseUrl,
				apiKey: this.options.openAiApiKey,
				apiVersion: this.options.azureApiVersion || azureOpenAiDefaultApiVersion,
			})
		} else {
			this.client = new OpenAI({
				baseURL: this.options.openAiBaseUrl,
				apiKey: this.options.openAiApiKey,
			})
		}
		logger.debug(`[OpenAiHandler] Inizializzato con baseURL: ${this.options.openAiBaseUrl || 'default'}`)
	}

	/**
	 * Implementazione del metodo astratto fetchAPIResponse
	 * Effettua la chiamata API a OpenAI e restituisce lo stream
	 */
	protected async fetchAPIResponse(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): Promise<Stream<ChatCompletionChunk>> {
		const modelId = this.options.openAiModelId ?? ""
		const isDeepseekReasoner = modelId.includes("deepseek-reasoner")
		const isR1FormatRequired = this.options.openAiModelInfo?.isR1FormatRequired ?? false

		logger.debug(`[OpenAiHandler] Preparazione richiesta per modello: ${modelId}`)

		let openAiMessages: ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		if (isDeepseekReasoner || isR1FormatRequired) {
			logger.debug(`[OpenAiHandler] Conversione messaggio al formato R1 richiesto`)
			openAiMessages = convertToR1Format([{ role: "user", content: systemPrompt }, ...messages])
		}

		const config = getOpenAiConfig(modelId, this.options.openAiModelInfo)
		
		logger.info(`[OpenAiHandler] Inizio chiamata API OpenAI con ${openAiMessages.length} messaggi`)
		
		try {
			const response = await this.client.chat.completions.create({
				model: modelId,
				messages: openAiMessages,
				temperature: config.temperature,
				...(config.maxTokens ? { maxTokens: config.maxTokens } : {}),
				...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
				stream: true,
				stream_options: { include_usage: true },
			})
			
			logger.info(`[OpenAiHandler] Risposta API OpenAI ricevuta correttamente`)
			return response
		} catch (error) {
			logger.error(`[OpenAiHandler] Errore durante la chiamata API OpenAI: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	/**
	 * Implementazione del metodo astratto convertToStream
	 * Questo converte lo stream OpenAI nello stesso formato
	 */
	protected convertToStream(stream: Stream<ChatCompletionChunk>): AsyncIterable<ChatCompletionChunk> {
		logger.debug(`[OpenAiHandler] Conversione risposta in stream`)
		// Lo stream OpenAI è già un AsyncIterable, quindi possiamo restituirlo direttamente
		return stream
	}

	/**
	 * Metodo pubblico createMessage, mantiene l'interfaccia ApiHandler
	 * ma utilizza transformToApiStream per la conversione
	 */
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		logger.info(`[OpenAiHandler] Creazione messaggio con modello ${this.getModel().id}`)
		
		// Otteniamo lo stream dalla classe base (con gestione retry)
		const rawStream = await this.getStream(systemPrompt, messages)
		
		logger.debug(`[OpenAiHandler] Stream ottenuto, inizio trasformazione in ApiStream`)
		
		// Utilizziamo transformToApiStream per convertire i chunk di OpenAI
		// in ApiStreamChunk standardizzati
		const apiStream = this.transformToApiStream(rawStream, chunk => {
			const results: ApiStreamChunk[] = []
			
			const openAiChunk = chunk as OpenAiStreamChunk
			const delta = openAiChunk.choices?.[0]?.delta ?? {}
			
			if (delta?.content) {
				results.push({
					type: "text",
					text: delta.content,
				})
			}

			if (delta?.reasoning_content) {
				results.push({
					type: "reasoning",
					reasoning: delta.reasoning_content,
				})
			}

			if (openAiChunk?.usage) {
				const openAiUsage = openAiChunk.usage
				logger.debug(`[OpenAiHandler] Ricevute informazioni di utilizzo: input=${openAiUsage.prompt_tokens}, output=${openAiUsage.completion_tokens}`)
				results.push({
					type: "usage",
					inputTokens: openAiUsage.prompt_tokens || 0,
					outputTokens: openAiUsage.completion_tokens || 0,
				})
			}
			
			return results
		})
		
		// Cediamo il controllo allo stream trasformato
		yield* apiStream
	}

	/**
	 * Implementazione del metodo getModel
	 */
	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.openAiModelId ?? "",
			info: this.options.openAiModelInfo ?? openAiModelInfoSaneDefaults,
		}
	}
}
