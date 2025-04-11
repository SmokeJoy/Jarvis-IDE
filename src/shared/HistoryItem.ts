import { ChatMessage } from "./types/message.js"
import { ApiConfiguration } from "./types/api.types.js"
import { AutoApprovalSettings, BrowserSettings, ChatSettings } from "./types/user-settings.types.js"
import { ChatCompletionContentPartText, ChatCompletionContentPartImage } from "./types/api.types.js"

// Definisco l'interfaccia con i tipi corretti importati dal file centralizzato
export interface HistoryItem {
	id: string
	task: string
	timestamp: number
	apiConfiguration: ApiConfiguration
	autoApprovalSettings: AutoApprovalSettings
	browserSettings: BrowserSettings
	chatSettings: ChatSettings
	customInstructions?: string
	tokensIn?: number
	tokensOut?: number
	role?: "user" | "assistant"
	content?: (ChatCompletionContentPartText | ChatCompletionContentPartImage)[]
}
