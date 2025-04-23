import { Logger } from './Logger';

/**
 * @file validate.ts
 * @description Funzioni di validazione per il sistema di messaggi tra WebView ed Extension
 */

const logger = new Logger('Validate');

/**
 * Interfaccia per il risultato della validazione dei messaggi
 */
export interface MessageValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Interfaccia base per i messaggi
 */
export interface BaseMessage<T = unknown> {
	type: string;
	payload: T;
	error?: string;
}

/**
 * Verifica se il valore è un oggetto
 * @param value Il valore da controllare
 * @returns true se è un oggetto
 */
export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifica se il valore è una stringa non vuota
 * @param value Il valore da controllare
 * @returns true se è una stringa non vuota
 */
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se l'oggetto è un BaseMessage
 * @param message L'oggetto da validare
 * @returns true se l'oggetto è un BaseMessage
 */
export function isBaseMessage(message: unknown): message is BaseMessage {
	if (!isObject(message)) {
		return false;
	}

	// Verifica che sia presente il tipo
	if (!isNonEmptyString(message.type)) {
		return false;
	}

	// Verifica che payload sia un oggetto se presente
	if ('payload' in message && message.payload !== undefined) {
		if (!isObject(message.payload) && typeof message.payload !== 'string' && !Array.isArray(message.payload)) {
			return false;
		}
	} else {
		return false; // payload è obbligatorio
	}

	// Verifica che error sia una stringa se presente
	if ('error' in message && message.error !== undefined && !isNonEmptyString(message.error)) {
		return false;
	}

	return true;
}

/**
 * Verifica che il messaggio abbia la struttura corretta
 * @param message Il messaggio da validare
 * @returns Il risultato della validazione
 */
export function validateMessage(message: unknown): MessageValidationResult {
	if (!isObject(message)) {
		return { valid: false, error: 'Il messaggio deve essere un oggetto' };
				}

	// Verifica il tipo
	if (!('type' in message) || !isNonEmptyString(message.type)) {
		return { valid: false, error: 'Tipo di messaggio non valido o mancante' };
				}

	// Verifica il payload
	if (!('payload' in message)) {
		return { valid: false, error: 'Payload mancante nel messaggio' };
	}

	// Verifica error se presente
	if ('error' in message && message.error !== undefined && !isNonEmptyString(message.error)) {
		return { valid: false, error: 'Campo error deve essere una stringa non vuota' };
	}

	logger.debug(`Messaggio validato con successo: ${message.type}`);
	return { valid: true };
}

/**
 * Verifica che il messaggio abbia determinati campi nel payload
 * @param message Il messaggio da validare
 * @param requiredFields I campi richiesti nel payload
 * @returns Il risultato della validazione
 */
export function validateMessageGeneric(
	message: unknown,
	requiredFields: string[] = []
): MessageValidationResult {
	// Prima validazione base
	const baseValidation = validateMessage(message);
	if (!baseValidation.valid) {
		return baseValidation;
	}

	// Cast sicuro dopo la validazione base
	const typedMessage = message as BaseMessage;
	const payload = typedMessage.payload;

	// Se non ci sono campi richiesti, la validazione è già completa
	if (requiredFields.length === 0) {
		return { valid: true };
				}

	// Verifica che payload sia un oggetto
	if (!isObject(payload)) {
		return { 
			valid: false, 
			error: `Il payload deve essere un oggetto per il messaggio di tipo ${typedMessage.type}` 
		};
	}

	// Verifica che tutti i campi richiesti siano presenti
	for (const field of requiredFields) {
		if (!(field in payload)) {
			return { 
				valid: false, 
				error: `Campo richiesto mancante nel payload: ${field} per il messaggio di tipo ${typedMessage.type}` 
			};
		}
	}

	logger.debug(`Validazione avanzata completata per il messaggio ${typedMessage.type} con successo`);
	return { valid: true };
}

/**
 * Crea una funzione di validazione per un tipo specifico di messaggio
 * @param messageType Il tipo di messaggio da validare
 * @param requiredFields I campi richiesti nel payload
 * @returns Una funzione per validare messaggi di quel tipo
 */
export function createMessageValidator(
	messageType: string,
	requiredFields: string[] = []
): (message: unknown) => MessageValidationResult {
	return (message: unknown): MessageValidationResult => {
		// Validazione di base
		const baseValidation = validateMessage(message);
		if (!baseValidation.valid) {
			return baseValidation;
		}

		// Cast sicuro
		const typedMessage = message as BaseMessage;

		// Verifica il tipo del messaggio
		if (typedMessage.type !== messageType) {
			return { 
				valid: false, 
				error: `Tipo di messaggio errato: atteso '${messageType}', ricevuto '${typedMessage.type}'` 
			};
		}

		// Validazione dei campi richiesti
		return validateMessageGeneric(message, requiredFields);
	};
}
