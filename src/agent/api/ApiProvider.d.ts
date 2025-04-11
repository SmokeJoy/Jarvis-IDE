import type { ChatMessage } from '../../types/ChatMessage.js';
/**
 * Handler per gestire i messaggi durante lo streaming
 */
export interface StreamHandler {
    /**
     * Chiamato quando un nuovo token viene ricevuto
     */
    onToken?: (token: string) => void;
    /**
     * Chiamato quando lo stream è completato
     */
    onComplete?: (fullResponse: string) => void;
    /**
     * Chiamato in caso di errore
     */
    onError?: (error: Error) => void;
}
/**
 * Interfaccia comune per tutti i provider di LLM
 * Utilizza il tipo ChatMessage standardizzato definito in types/ChatMessage.ts
 */
export interface ApiProvider {
    /**
     * Identificatore unico del provider
     */
    readonly id: string;
    /**
     * Etichetta leggibile del provider
     */
    readonly label: string;
    /**
     * Verifica se il provider supporta lo streaming
     */
    isStreamable(): boolean;
    /**
     * Effettua una chiamata in streaming per la generazione di testo
     * @param messages Lista di messaggi della conversazione nel formato standardizzato
     * @param apiKey Chiave API per l'autenticazione
     * @param endpoint Endpoint API opzionale
     * @param handler Handler per gestire i token ricevuti in streaming
     * @returns Il testo completo generato
     */
    streamChat(messages: ChatMessage[], apiKey: string, endpoint?: string, handler?: StreamHandler): Promise<string>;
    /**
     * Effettua una chiamata non-streaming per la generazione di testo
     * @param messages Lista di messaggi della conversazione nel formato standardizzato
     * @param apiKey Chiave API per l'autenticazione
     * @param endpoint Endpoint API opzionale
     * @returns Il testo completo generato
     */
    chat(messages: ChatMessage[], apiKey: string, endpoint?: string): Promise<string>;
}
//# sourceMappingURL=ApiProvider.d.ts.map