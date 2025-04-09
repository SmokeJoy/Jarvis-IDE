/**
 * Funzione di utilità per convertire messaggi da altri formati a ChatMessage
 */
export function toChatMessage(message) {
    return {
        role: message.role,
        content: message.content,
        name: message.name,
        timestamp: message.timestamp || Date.now(),
        streaming: message.streaming || false
    };
}
/**
 * Funzione di utilità per normalizzare un array di messaggi al formato ChatMessage
 */
export function normalizeChatMessages(messages) {
    return messages.map(toChatMessage);
}
//# sourceMappingURL=ChatMessage.js.map