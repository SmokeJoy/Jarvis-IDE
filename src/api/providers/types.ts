// For the following openrouter error type sources, see the docs here:
// https://openrouter.ai/docs/api-reference/errors

import { ChatCompletionMessageParam } from "openai";
import { BedrockModelId, JarvisIdeModelId, OpenRouterModelId, QwenModelId } from "../../shared/api.js";

export interface ApiHandler {
	streamChat(messages: ChatCompletionMessageParam[]): AsyncIterator<string>;
	chat(messages: ChatCompletionMessageParam[]): Promise<ChatCompletionMessageParam>;
}

export interface OpenRouterErrorResponse {
	error: {
		message: string;
		type: string;
		param: string | null;
		code: string | null;
	};
}

export type ModelId = BedrockModelId | JarvisIdeModelId | OpenRouterModelId | QwenModelId;

export type OpenRouterProviderErrorMetadata = {
	provider_name: string // The name of the provider that encountered the error
	raw: unknown // The raw error from the provider
}

export type OpenRouterModerationErrorMetadata = {
	reasons: string[] // Why your input was flagged
	flagged_input: string // The text segment that was flagged, limited to 100 characters. If the flagged input is longer than 100 characters, it will be truncated in the middle and replaced with ...
	provider_name: string // The name of the provider that requested moderation
	model_slug: string
}
