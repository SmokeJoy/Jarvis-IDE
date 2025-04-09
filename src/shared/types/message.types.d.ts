/**
 * @file message.types.ts
 * @description Definizione delle interfacce per i messaggi di chat
 */
/**
 * Interfaccia per i messaggi di chat
 */
export interface ChatMessage {
    /** Identificatore univoco del messaggio */
    id: string;
    /** Ruolo del mittente del messaggio (utente o assistente) */
    role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
    /** Contenuto del messaggio */
    content: string;
    /** Timestamp di creazione del messaggio */
    timestamp: number;
    /** Flag che indica se il messaggio è in fase di streaming */
    streaming?: boolean;
    /** Nome della funzione o strumento, se applicabile */
    name?: string;
}
//# sourceMappingURL=message.types.d.ts.map