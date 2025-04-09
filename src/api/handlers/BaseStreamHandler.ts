import { retryAsync } from "../retry.js.js"
import { ApiStream, ApiStreamChunk, createMockStream } from "../transform/stream.js.js"
import type { ApiHandlerOptions } from "../../shared/types/api.types.js.js"
import { logger } from "../../utils/logger.js.js"

/**
 * Classe base per handler API che forniscono uno stream
 */
export abstract class BaseStreamHandler<TChunk = ApiStreamChunk, TAPIResponse = any> {
	protected options: ApiHandlerOptions

	constructor(options: ApiHandlerOptions) {
		this.options = options
		logger.debug(`[BaseStreamHandler] Inizializzato handler con opzioni: ${JSON.stringify(options)}`)
	}

	/**
	 * Metodo astratto da implementare nei subclass:
	 * Effettua la chiamata all'API e restituisce un oggetto di risposta specifico per il provider
	 */
	protected abstract fetchAPIResponse(prompt: string, messages: any[]): Promise<TAPIResponse>

	/**
	 * Metodo astratto che converte la risposta API in un oggetto iterabile
	 * Questo deve essere implementato da ogni provider in base al formato della loro risposta
	 */
	protected abstract convertToStream(apiResponse: TAPIResponse): AsyncIterable<TChunk>

	/**
	 * Metodo pubblico per ottenere uno stream tipizzato di chunks
	 * Gestisce automaticamente retry usando retryAsync
	 */
	async getStream(prompt: string, messages: any[]): Promise<AsyncIterable<TChunk>> {
		logger.info(`[${this.constructor.name}] Generazione stream per modello ${this.getModel().id}`)
		logger.debug(`[${this.constructor.name}] Messaggio: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`)
		logger.debug(`[${this.constructor.name}] Numero messaggi: ${messages.length}`)
		
		try {
			const response = await retryAsync(() => this.fetchAPIResponse(prompt, messages))
			logger.debug(`[${this.constructor.name}] Risposta API ricevuta, conversione in stream`)
			return this.convertToStream(response)
		} catch (error) {
			logger.error(`[${this.constructor.name}] Errore durante la generazione dello stream: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	/**
	 * Metodo astratto per ottenere informazioni sul modello
	 */
	abstract getModel(): { id: string; info: any }

	/**
	 * Metodo di utilità per convertire uno stream generico in ApiStream
	 * con i tipi di chunk standardizzati del progetto
	 * 
	 * @param iterator Lo stream originale di chunk dal provider
	 * @param transformer Una funzione che converte ogni chunk in uno o più ApiStreamChunk
	 * @returns Un ApiStream con i chunk trasformati
	 */
	protected async *transformToApiStream(
		iterator: AsyncIterable<TChunk>,
		transformer: (chunk: TChunk) => ApiStreamChunk[]
	): ApiStream {
		logger.debug(`[${this.constructor.name}] Inizio trasformazione stream`)
		let chunkCount = 0
		
		try {
			for await (const chunk of iterator) {
				// Trasformiamo il chunk usando la funzione fornita
				const transformedChunks = transformer(chunk);
				chunkCount++
				
				// Log di debug ogni 20 chunk per non intasare il log
				if (chunkCount % 20 === 0) {
					logger.debug(`[${this.constructor.name}] Trasformati ${chunkCount} chunks finora`)
				}
				
				// Emettiamo ogni chunk trasformato
				for (const transformedChunk of transformedChunks) {
					yield transformedChunk;
				}
			}
			logger.debug(`[${this.constructor.name}] Trasformazione stream completata, totale chunks: ${chunkCount}`)
		} catch (error) {
			logger.error(`[${this.constructor.name}] Errore durante la trasformazione dello stream: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}
} 