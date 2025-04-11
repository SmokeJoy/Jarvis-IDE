/**
 * @file global.ts
 * @description Tipi globali centralizzati per l'applicazione
 * Questo file contiene definizioni di tipi utilizzati in tutto il sistema
 */
import { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js";
import { BaseMessage } from "./message.js";
import { LLMProviderId } from "./llm.types.js";
export type { LLMProviderId, BaseMessage };
export type { ChatCompletionMessageParam };
export type { ChatCompletionContentPartText, ChatCompletionContentPartImage } from "./api.types.js";
export interface ApiConfiguration {
    provider: string;
    apiKey?: string;
    apiModelId?: string;
    openRouterModelInfo?: any;
    openRouterModelId?: string;
    openRouterApiKey?: string;
    openRouterProviderSorting?: string | boolean;
    openAiModelInfo?: any;
    openAiApiKey?: string;
    openAiBaseUrl?: string;
    openAiModelId?: string;
    anthropicApiKey?: string;
    anthropicModelInfo?: any;
    anthropicBaseUrl?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsAccessKey?: string;
    awsSecretKey?: string;
    awsSessionToken?: string;
    awsRegion?: string;
    awsBedrockEndpoint?: string;
    awsUseCrossRegionInference?: boolean;
    awsBedrockUsePromptCache?: boolean;
    awsUseProfile?: boolean;
    awsProfile?: string;
    azureApiKey?: string;
    azureDeploymentName?: string;
    azureEndpoint?: string;
    azureApiVersion?: string;
    geminiApiKey?: string;
    ollamaBaseUrl?: string;
    ollamaModelId?: string;
    ollamaApiOptionsCtxNum?: string;
    lmStudioBaseUrl?: string;
    lmStudioModelId?: string;
    openAiNativeApiKey?: string;
    jarvisIdeApiKey?: string;
    customInstructions?: string;
    deepSeekApiKey?: string;
    requestyApiKey?: string;
    requestyModelId?: string;
    togetherApiKey?: string;
    togetherModelId?: string;
    qwenApiKey?: string;
    qwenApiLine?: string;
    mistralApiKey?: string;
    vsCodeLmModelSelector?: any;
    liteLlmBaseUrl?: string;
    liteLlmModelId?: string;
    liteLlmApiKey?: string;
    vertexProjectId?: string;
    vertexRegion?: string;
    o3MiniReasoningEffort?: string;
    asksageApiUrl?: string;
    asksageApiKey?: string;
    xaiApiKey?: string;
    thinkingBudgetTokens?: number;
    sambanovaApiKey?: string;
}
//# sourceMappingURL=global.d.ts.map