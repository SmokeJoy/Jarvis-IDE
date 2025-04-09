/**
 * @file chat.types.ts
 * @description Definizione centralizzata per tipi di messaggi chat e contenuti multimodali
 */
/**
 * Tipo di contenuto supportato nei messaggi multimodali
 */
export var ContentType;
(function (ContentType) {
    ContentType["Text"] = "text";
    ContentType["Image"] = "image_url";
    ContentType["ToolUse"] = "tool_use";
    ContentType["ToolResult"] = "tool_result";
})(ContentType || (ContentType = {}));
/**
 * Funzione di utility per normalizzare un messaggio
 */
export function normalizeMessage(message) {
    return {
        ...message,
        content: typeof message.content === 'string'
            ? [{ type: ContentType.Text, text: message.content }]
            : message.content,
        timestamp: message.timestamp || new Date().toISOString()
    };
}
//# sourceMappingURL=chat.types.js.map