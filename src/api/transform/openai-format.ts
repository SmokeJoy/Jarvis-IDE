/**
 * @file openai-format.ts
 * @description Transformer per il formato OpenAI
 */

import { 
	ChatMessage, 
	ContentBlock, 
	TextBlock, 
	ImageBlock, 
	ContentType, 
	isTextBlock, 
	isImageBlock 
} from '../../types/chat.types.js';
import { 
	OpenAIOptions, 
	ChatCompletionOptions, 
	ChatCompletionMessageParam, 
	ChatCompletionChunk, 
	ChatCompletion, 
	ChatCompletionContentPartText, 
	ChatCompletionContentPartImage 
} from '../../types/provider-types/openai-types.js';
import { BaseTransformer, TokenUsage, BaseRequestOptions, ContentUtils } from './BaseTransformer.js';
import { logger } from "../../utils/logger.js";

/**
 * Transformer per convertire tra il formato ChatMessage standard e il formato OpenAI
 */
export class OpenAITransformer implements BaseTransformer<ChatCompletionOptions, ChatCompletionMessageParam, ChatCompletionChunk, ChatCompletion> {
	/**
	 * Converte messaggi da formato standard a formato OpenAI
	 * 
	 * @param messages Array di messaggi in formato standard
	 * @returns Array di messaggi nel formato OpenAI
	 */
	static toLLMMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
		return messages.map(message => {
			// Converti ruolo (system, user, assistant) - già compatibile con OpenAI
			const role = message.role;
			
			// Gestisci diversi formati di contenuto
			let content: string | Array<ChatCompletionContentPartText | ChatCompletionContentPartImage>;
			
			if (typeof message.content === 'string') {
				// Se è una stringa, usala direttamente
				content = message.content;
			} else if (Array.isArray(message.content)) {
				// Se è un array di ContentBlock, convertilo nel formato OpenAI
				content = message.content.map(part => {
					if (isTextBlock(part)) {
						// Converti parte testuale
						return { 
							type: 'text', 
							text: part.text 
						} as ChatCompletionContentPartText;
					} else if (isImageBlock(part)) {
						// Converti parte immagine
						return {
							type: 'image',
							source: {
								type: part.url ? 'url' : 'base64',
								media_type: part.media_type,
								data: part.base64Data,
								url: part.url
							}
						} as ChatCompletionContentPartImage;
					}
					
					// Ignora altri tipi di contenuto non supportati da OpenAI
					return { type: 'text', text: '[Contenuto non supportato]' };
				});
			} else {
				// Fallback per contenuto non valido
				content = '[Contenuto non valido]';
			}
			
								return {
				role,
				content,
				name: message.name
			} as ChatCompletionMessageParam;
		});
	}
	
	/**
	 * Crea le opzioni di richiesta per OpenAI
	 * 
	 * @param options Opzioni di base
	 * @param messages Messaggi già convertiti nel formato OpenAI
	 * @returns Opzioni di richiesta complete per OpenAI
	 */
	static createRequestOptions(options: BaseRequestOptions, messages: ChatCompletionMessageParam[]): ChatCompletionOptions {
		const openaiOptions: ChatCompletionOptions = {
			model: options.model,
			messages: messages,
			temperature: options.temperature,
			max_tokens: options.maxTokens,
			stream: options.stream || false
		};
		
		// Aggiungi systemPrompt se fornito
		if (options.systemPrompt && options.systemPrompt.trim() !== '') {
			openaiOptions.messages.unshift({
				role: 'system',
				content: options.systemPrompt
			});
		}
		
		// Aggiungi funzioni se fornite
		if (options.functions && options.functions.length > 0) {
			openaiOptions.functions = options.functions;
		}
		
		return openaiOptions;
	}
	
	/**
	 * Estrae il testo da un chunk di risposta streaming
	 * 
	 * @param chunk Chunk di risposta streaming di OpenAI
	 * @returns Testo estratto dal chunk
	 */
	static extractTextFromChunk(chunk: ChatCompletionChunk): string | undefined {
		if (!chunk || !chunk.choices || chunk.choices.length === 0) {
			return undefined;
		}
		
		return chunk.choices[0].delta.content;
	}
	
	/**
	 * Estrae il testo di ragionamento da un chunk di risposta streaming
	 * 
	 * @param chunk Chunk di risposta streaming di OpenAI
	 * @returns Testo di ragionamento estratto dal chunk
	 */
	static extractReasoningFromChunk(chunk: ChatCompletionChunk): string | undefined {
		if (!chunk || !chunk.choices || chunk.choices.length === 0) {
			return undefined;
		}
		
		return chunk.choices[0].delta.reasoning_content;
	}
	
	/**
	 * Estrae informazioni di utilizzo token
	 * 
	 * @param response Risposta completa o chunk di OpenAI
	 * @returns Informazioni su utilizzo token
	 */
	static extractTokenUsage(response: ChatCompletion | ChatCompletionChunk): TokenUsage | undefined {
		if (!response || !response.usage) {
			return undefined;
		}
		
		return {
			promptTokens: response.usage.prompt_tokens,
			completionTokens: response.usage.completion_tokens,
			totalTokens: response.usage.total_tokens
		};
	}
	
	/**
	 * Converte una risposta completa di OpenAI in un messaggio standardizzato
	 * 
	 * @param response Risposta completa di OpenAI
	 * @returns Messaggio in formato standard
	 */
	static fromLLMResponse(response: ChatCompletion): ChatMessage {
		if (!response || !response.choices || response.choices.length === 0) {
			return {
				role: 'assistant',
				content: '',
				timestamp: new Date().toISOString()
			};
		}
		
		const choice = response.choices[0];
		let content: string | ContentBlock[] = '';
		
		if (typeof choice.message.content === 'string') {
			content = choice.message.content;
		} else if (Array.isArray(choice.message.content)) {
			// Converti il contenuto multimodale se presente
			content = choice.message.content.map(part => {
				if (part.type === 'text') {
					return {
						type: ContentType.Text,
						text: part.text
					} as TextBlock;
				} else if (part.type === 'image') {
					return {
						type: ContentType.Image,
						url: part.source?.url,
						base64Data: part.source?.data,
						media_type: part.source?.media_type
					} as ImageBlock;
				}
				return {
					type: ContentType.Text,
					text: '[Contenuto non supportato]'
				} as TextBlock;
			});
		}
		
		return {
			role: 'assistant',
			content: content,
			timestamp: new Date().toISOString(),
			providerFields: {
				model: response.model,
				stopReason: choice.finish_reason,
				usage: {
					promptTokens: response.usage?.prompt_tokens,
					completionTokens: response.usage?.completion_tokens,
					totalTokens: response.usage?.total_tokens
				}
			}
		};
	}
}

// Esporta come singolo per evitare accesso alle proprietà come Transformer.property
export const toLLMMessages = OpenAITransformer.toLLMMessages;
export const createRequestOptions = OpenAITransformer.createRequestOptions;
export const extractTextFromChunk = OpenAITransformer.extractTextFromChunk;
export const extractReasoningFromChunk = OpenAITransformer.extractReasoningFromChunk;
export const extractTokenUsage = OpenAITransformer.extractTokenUsage;
export const fromLLMResponse = OpenAITransformer.fromLLMResponse;

/**
 * Utilità per gestire contenuti multimodali e strumenti
 */
export function processMultimodalContent(content: any[]): ContentBlock[] {
	return content.map(item => {
		if (typeof item === 'string') {
			return { 
				type: ContentType.Text, 
				text: item 
			} as TextBlock;
		}
		
		if (item.type === 'image_url') {
			const url = item.image_url.url;
			// Handle base64 images
			if (url.startsWith('data:')) {
				const [metaPart, dataPart] = url.split(',');
				const mediaType = metaPart.split(':')[1].split(';')[0];
				
				return {
					type: ContentType.Image,
					base64Data: dataPart,
					media_type: mediaType
				} as ImageBlock;
			}
			
			// Handle URL images
			return {
				type: ContentType.Image,
				url: url
			} as ImageBlock;
		}
		
		return { 
			type: ContentType.Text, 
			text: '[Contenuto non supportato]' 
		} as TextBlock;
	});
}
