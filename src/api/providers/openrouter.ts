import { Anthropic } from "@anthropic-ai/sdk";
import { OpenAiCompatibleModelInfo, ModelInfo, ApiStream, ApiStreamChunk, ApiStreamTextChunk, ApiStreamUsageChunk } from '../../shared/types/api.types.js';
import { ApiHandler } from '../index.js';
import { BaseStreamHandler } from "../handlers/BaseStreamHandler.js";
import { retryAsync } from "../retry.js";
import { logger } from "../../utils/logger.js";
import { ChatCompletionMessageParam } from "openai";
import { convertToOpenAiMessages } from "../transform/openai-format.js";
import { OpenRouterModelId } from "../../shared/api.js";
import { convertToR1Format } from "../transform/o1-format.js";

/**
 * Tipo per rappresentare la risposta di OpenRouter
 */
interface OpenRouterChunk {
	choices?: Array<{
		delta?: {
			content?: string;
		};
	}>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
}

/**
 * Handler per l'integrazione con OpenRouter.ai che estende BaseStreamHandler
 * Supporta modelli come GPT-4, Claude 3, CodeLlama, ecc.
 */
export class OpenRouterHandler extends BaseStreamHandler<OpenRouterChunk> implements ApiHandler {
	private apiKey: string;
	private model: OpenAiCompatibleModelInfo;

	constructor(options: {
		apiKey: string;
		model: OpenAiCompatibleModelInfo;
	}) {
		super({} as ApiHandlerOptions);
		this.apiKey = options.apiKey;
		this.model = options.model;
		logger.debug(`[OpenRouterHandler] Inizializzato con modello: ${this.model.id}`);
	}

	/**
	 * Implementazione del metodo astratto fetchAPIResponse
	 * Effettua la chiamata API a OpenRouter e restituisce un lettore per lo stream di dati
	 */
	protected async fetchAPIResponse(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>, response: Response }> {
		// Converti il formato dei messaggi se necessario
		const formattedMessages: ChatCompletionMessageParam[] = messages.length > 0
			? [{ role: 'system', content: systemPrompt }, ...convertToOpenAiMessages(messages)]
			: [{ role: 'user', content: systemPrompt }];
		
		logger.info(`[OpenRouterHandler] Inizio chiamata API OpenRouter per modello: ${this.model.id}`);
		logger.debug(`[OpenRouterHandler] Richiesta a OpenRouter con ${formattedMessages.length} messaggi`);
		
		try {
			const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
					'HTTP-Referer': 'https://github.com/ai-developer-panel/ai-developer-panel',
					'X-Title': 'AI Developer Panel'
				},
				body: JSON.stringify({
					model: this.model.id,
					messages: formattedMessages,
					stream: true
				})
			});

			logger.debug(`[OpenRouterHandler] Risposta ricevuta con status: ${response.status}`);
			
			if (!response.ok) {
				const errorText = await response.text().catch(() => 'No error text available');
				logger.error(`[OpenRouterHandler] Errore API: ${response.status} ${response.statusText} - ${errorText}`);
				throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				logger.error('[OpenRouterHandler] Response body è null');
				throw new Error('Response body is null');
			}

			return { reader, response };
		} catch (error) {
			logger.error(`[OpenRouterHandler] Errore durante la richiesta: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Implementazione del metodo astratto convertToStream
	 * Questo converte lo stream di risposta OpenRouter in un AsyncIterable tipizzato
	 */
	protected async *convertToStream(responseData: { reader: ReadableStreamDefaultReader<Uint8Array>, response: Response }): AsyncIterable<OpenRouterChunk> {
		const { reader } = responseData;
		const decoder = new TextDecoder();
		let buffer = '';
		let messageCount = 0;

		logger.debug('[OpenRouterHandler] Inizio conversione stream');
		
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					logger.debug('[OpenRouterHandler] Lettura stream completata');
					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim() === '') continue;
					if (line === 'data: [DONE]') {
						logger.debug('[OpenRouterHandler] Ricevuto messaggio di fine stream: [DONE]');
						continue;
					}

					try {
						if (line.startsWith('data: ')) {
							const data = JSON.parse(line.substring(6)) as OpenRouterChunk;
							messageCount++;
							
							// Log ogni 20 messaggi per non intasare il log
							if (messageCount % 20 === 0) {
								logger.debug(`[OpenRouterHandler] Processati ${messageCount} messaggi stream`);
							}
							
							yield data;
						}
					} catch (e) {
						logger.error(`[OpenRouterHandler] Errore parsing messaggio SSE: ${e instanceof Error ? e.message : String(e)}`);
					}
				}
			}
		} finally {
			logger.debug(`[OpenRouterHandler] Stream completato, processati ${messageCount} messaggi totali`);
			reader.releaseLock();
		}
	}

	/**
	 * Metodo pubblico createMessage, mantiene l'interfaccia ApiHandler
	 * ma utilizza transformToApiStream per la conversione
	 */
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		logger.info(`[OpenRouterHandler] Creazione messaggio con modello ${this.getModel().id}`);
		
		// Otteniamo lo stream dalla classe base (con gestione retry)
		const rawStream = await this.getStream(systemPrompt, messages);
		
		logger.debug('[OpenRouterHandler] Stream ottenuto, inizio trasformazione in ApiStream');
		
		// Utilizziamo transformToApiStream per convertire i chunk di OpenRouter
		// in ApiStreamChunk standardizzati
		const apiStream = this.transformToApiStream(rawStream, chunk => {
			const results: ApiStreamChunk[] = [];
			
			// Gestiamo il contenuto testuale
			if (chunk.choices?.[0]?.delta?.content) {
				results.push({
					type: "text",
					text: chunk.choices[0].delta.content
				});
			}

			// Gestiamo le informazioni di utilizzo
			if (chunk.usage) {
				const cost = this.calculateCost(chunk.usage);
				logger.debug(`[OpenRouterHandler] Informazioni di utilizzo ricevute: input=${chunk.usage.prompt_tokens || 0}, output=${chunk.usage.completion_tokens || 0}, costo=${cost}`);
				
				results.push({
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
					totalCost: cost
				});
			}
			
			return results;
		});
		
		// Cediamo il controllo allo stream trasformato
		yield* apiStream;
	}

	/**
	 * Calcola il costo della richiesta in base al modello e al numero di token
	 */
	private calculateCost(usage: { prompt_tokens?: number, completion_tokens?: number }): number {
		const model = this.model;
		const inputTokens = usage.prompt_tokens || 0;
		const outputTokens = usage.completion_tokens || 0;
		
		// Se il modello ha prezzi specifici, li utilizziamo, altrimenti restituiamo 0
		if (model.inputPrice && model.outputPrice) {
			const cost = (inputTokens * model.inputPrice / 1_000_000) + 
					 (outputTokens * model.outputPrice / 1_000_000);
			
			logger.debug(`[OpenRouterHandler] Calcolato costo: ${cost} (input: ${inputTokens} x ${model.inputPrice}, output: ${outputTokens} x ${model.outputPrice})`);
			return cost;
		}
		
		logger.debug('[OpenRouterHandler] Nessun prezzo definito nel modello, costo calcolato: 0');
		return 0;
	}

	/**
	 * Implementazione del metodo getModel
	 */
	getModel(): { id: string; info: OpenAiCompatibleModelInfo } {
		return {
			id: this.model.id,
			info: this.model
		};
	}
}

export interface OpenRouterConfig {
	apiKey: string;
}

export class OpenRouterProvider {
	constructor(private config: OpenRouterConfig, private modelId: string) {}

	public async chat(messages: any[], signal?: AbortSignal): Promise<ApiStream> {
		// Implementazione del metodo chat per OpenRouter
		throw new Error("Not implemented");
	}

	public async streamChat(messages: any[], signal?: AbortSignal): Promise<AsyncGenerator<ApiStreamChunk>> {
		// Implementazione del metodo streamChat per OpenRouter
		throw new Error("Not implemented");
	}
}
