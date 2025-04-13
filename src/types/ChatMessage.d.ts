/**
 * Interfaccia che definisce la struttura di un messaggio di chat
 * compatibile con tutti i provider LLM
 */
export interface ChatMessage {
  /**
   * Il ruolo del messaggio: system, user o assistant
   */
  role: 'system' | 'user' | 'assistant';
  /**
   * Il contenuto testuale del messaggio
   */
  content: string;
  /**
   * Nome opzionale per identificare l'autore del messaggio
   */
  name?: string;
  /**
   * Timestamp del messaggio
   */
  timestamp?: number;
  /**
   * Flag che indica se il messaggio è in streaming
   */
  streaming?: boolean;
}
/**
 * Funzione di utilità per convertire messaggi da altri formati a ChatMessage
 */
export declare function toChatMessage(message: any): ChatMessage;
/**
 * Funzione di utilità per normalizzare un array di messaggi al formato ChatMessage
 */
export declare function normalizeChatMessages(messages: any[]): ChatMessage[];
//# sourceMappingURL=ChatMessage.d.ts.map
