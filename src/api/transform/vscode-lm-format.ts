import type { Anthropic } from "@anthropic-ai/sdk"
import * as vscode from "vscode"
import type { 
	ChatMessage, 
	ContentBlock, 
	TextBlock, 
	ImageBlock, 
	ToolUseBlock,
	ToolResultBlock,
	ContentType, 
	isTextBlock, 
	isImageBlock,
	isToolUseBlock,
	isToolResultBlock
} from "../../types/chat.types.js"

/**
 * Safely converts a value into a plain object.
 */
function asObjectSafe(value: any): object {
	// Handle null/undefined
	if (!value) {
		return {}
	}

	try {
		// Handle strings that might be JSON
		if (typeof value === "string") {
			return JSON.parse(value)
		}

		// Handle pre-existing objects
		if (typeof value === "object") {
			return Object.assign({}, value)
		}

		return {}
	} catch (error) {
		console.warn("Jarvis IDE <Language Model API>: Failed to parse object:", error)
		return {}
	}
}

interface SplitMessages {
	nonToolMessages: (TextBlock | ImageBlock)[];
	toolMessages: (ToolUseBlock | ToolResultBlock)[];
}

export function convertToVsCodeLmMessages(
	messages: ChatMessage[],
): vscode.LanguageModelChatMessage[] {
	const vsCodeLmMessages: vscode.LanguageModelChatMessage[] = []

	for (const message of messages) {
		// Handle simple string messages
		if (typeof message.content === "string") {
			vsCodeLmMessages.push(
				message.role === "assistant"
					? vscode.LanguageModelChatMessage.Assistant(message.content)
					: vscode.LanguageModelChatMessage.User(message.content),
			)
			continue
		}

		// Handle complex message structures
		switch (message.role) {
			case "user": {
				const { nonToolMessages, toolMessages } = message.content.reduce<{
					nonToolMessages: (TextBlock | ImageBlock)[]
					toolMessages: ToolResultBlock[]
				}>(
					(acc, part) => {
						if (isToolResultBlock(part)) {
							acc.toolMessages.push(part)
						} else if (isTextBlock(part) || isImageBlock(part)) {
							acc.nonToolMessages.push(part)
						}
						return acc
					},
					{ nonToolMessages: [], toolMessages: [] },
				)

				// Process tool messages first then non-tool messages
				const contentParts = [
					// Convert tool messages to ToolResultParts
					...toolMessages.map((toolMessage) => {
						// Format tool result as text since VSCode LM API doesn't have a direct equivalent
						const resultText = typeof toolMessage.result === "string" 
							? toolMessage.result 
							: JSON.stringify(toolMessage.result, null, 2);
						
						return new vscode.LanguageModelToolResultPart(
							toolMessage.toolUseId || "",
							[new vscode.LanguageModelTextPart(resultText)]
						);
					}),

					// Convert non-tool messages to TextParts after tool messages
					...nonToolMessages.map((part) => {
						if (isImageBlock(part)) {
							const sourceType = part.url ? "url" : "base64";
							return new vscode.LanguageModelTextPart(
								`[Image (${sourceType}): ${part.media_type || "unknown"} not supported by VSCode LM API]`,
							)
						}
						return new vscode.LanguageModelTextPart(isTextBlock(part) ? part.text : "[Contenuto non supportato]")
					}),
				]

				// Add single user message with all content parts
				vsCodeLmMessages.push(vscode.LanguageModelChatMessage.User(contentParts))
				break
			}

			case "assistant": {
				const { nonToolMessages, toolMessages } = message.content.reduce<{
					nonToolMessages: (TextBlock | ImageBlock)[]
					toolMessages: ToolUseBlock[]
				}>(
					(acc, part) => {
						if (isToolUseBlock(part)) {
							acc.toolMessages.push(part)
						} else if (isTextBlock(part) || isImageBlock(part)) {
							acc.nonToolMessages.push(part)
						}
						return acc
					},
					{ nonToolMessages: [], toolMessages: [] },
				)

				// Process tool messages first then non-tool messages
				const contentParts = [
					// Convert tool messages to ToolCallParts first
					...toolMessages.map(
						(toolMessage) =>
							new vscode.LanguageModelToolCallPart(
								toolMessage.id || crypto.randomUUID(),
								toolMessage.tool_name,
								asObjectSafe(toolMessage.input),
							),
					),

					// Convert non-tool messages to TextParts after tool messages
					...nonToolMessages.map((part) => {
						if (isImageBlock(part)) {
							const sourceType = part.url ? "url" : "base64";
							return new vscode.LanguageModelTextPart(
								`[Image (${sourceType}): ${part.media_type || "unknown"} not supported by VSCode LM API]`,
							)
						}
						return new vscode.LanguageModelTextPart(isTextBlock(part) ? part.text : "[Contenuto non supportato]")
					}),
				]

				// Add the assistant message to the list of messages
				vsCodeLmMessages.push(vscode.LanguageModelChatMessage.Assistant(contentParts))
				break
			}
		}
	}

	return vsCodeLmMessages
}

export function convertToRole(vsCodeLmMessageRole: vscode.LanguageModelChatMessageRole): "assistant" | "user" | "system" {
	switch (vsCodeLmMessageRole) {
		case vscode.LanguageModelChatMessageRole.Assistant:
			return "assistant"
		case vscode.LanguageModelChatMessageRole.User:
			return "user"
		default:
			return "system"
	}
}

export async function convertFromVsCodeLmMessage(
	vsCodeLmMessage: vscode.LanguageModelChatMessage,
): Promise<ChatMessage> {
	const role = convertToRole(vsCodeLmMessage.role);
	const content: ContentBlock[] = [];

	// Processa ogni parte del messaggio VSCode LM
	for (const part of vsCodeLmMessage.content) {
		if (part instanceof vscode.LanguageModelTextPart) {
			content.push({
				type: ContentType.Text,
				text: part.value
			} as TextBlock);
		}
		else if (part instanceof vscode.LanguageModelToolCallPart) {
			content.push({
				type: ContentType.ToolUse,
				tool_name: part.name,
				input: part.input || {},
				id: part.callId
			} as ToolUseBlock);
		}
		else if (part instanceof vscode.LanguageModelToolResultPart) {
			// Converti i risultati dello strumento
			let resultText = "";
			
			// Estrai il testo dalle parti del risultato
			for (const resultPart of part.result) {
				if (resultPart instanceof vscode.LanguageModelTextPart) {
					resultText += resultPart.value;
				}
			}
			
			content.push({
				type: ContentType.ToolResult,
				tool_name: "unknown", // VSCode LM non fornisce il nome dello strumento, solo l'ID
				result: resultText,
				toolUseId: part.callId
			} as ToolResultBlock);
		}
	}

	return {
		role,
		content,
		timestamp: new Date().toISOString()
	};
}
