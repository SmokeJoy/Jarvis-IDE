import { ApiConfiguration, OpenAiCompatibleModelInfo } from "../../types/extension"

export function getOpenRouterAuthUrl(uriScheme?: string) {
    return `https://openrouter.ai/auth${uriScheme ? `?redirect_uri=${uriScheme}` : ""}`
}

export const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price / 1000)
}

export interface ApiHandlerOptions {
    apiKey: string;
    baseUrl?: string;
    modelId?: string;
    modelInfo?: OpenAiCompatibleModelInfo;
}

export const normalizeApiConfiguration = (apiConfiguration: ApiConfiguration | undefined) => {
    if (!apiConfiguration) {
        return {
            selectedProvider: "openrouter",
            selectedModelId: "",
            selectedModelInfo: {
                id: "",
                name: "",
                context_length: 0,
                temperature: 0,
                maxTokens: 0,
                supportsImages: false,
                supportsPromptCache: false,
                supportsComputerUse: false,
                isR1FormatRequired: false,
                contextWindow: 0,
                inputPrice: 0,
                outputPrice: 0,
                description: "",
                pricing: {
                    prompt: 0,
                    completion: 0
                }
            }
        };
    }

    return {
        selectedProvider: apiConfiguration.provider || "openrouter",
        selectedModelId: apiConfiguration.openAiModelInfo?.id || "",
        selectedModelInfo: apiConfiguration.openAiModelInfo || {
            id: "",
            name: "",
            context_length: 0,
            temperature: 0,
            maxTokens: 0,
            supportsImages: false,
            supportsPromptCache: false,
            supportsComputerUse: false,
            isR1FormatRequired: false,
            contextWindow: 0,
            inputPrice: 0,
            outputPrice: 0,
            description: "",
            pricing: {
                prompt: 0,
                completion: 0
            }
        }
    };
}

export const createDefaultModelInfo = (): OpenAiCompatibleModelInfo => {
    return {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        context_length: 4000,
        temperature: 0.7,
        maxTokens: 1000,
        contextWindow: 4000,
        description: 'Default model',
        provider: 'openai',
        inputPrice: 0.001,
        outputPrice: 0.002,
        supportsPromptCache: true,
        supportsFunctionCalling: true,
        supportsVision: false
    };
};

export const validateApiConfiguration = (config: any): string[] => {
    const errors: string[] = [];

    if (!config.provider) {
        errors.push('Provider is required');
    }

    if (config.provider === 'openai' && !config.openAiApiKey) {
        errors.push('OpenAI API key is required');
    }

    if (config.provider === 'anthropic' && !config.anthropicApiKey) {
        errors.push('Anthropic API key is required');
    }

    if (config.provider === 'openrouter' && !config.openRouterApiKey) {
        errors.push('OpenRouter API key is required');
    }

    return errors;
};

export function getDefaultModelInfo(): OpenAiCompatibleModelInfo {
    return {
        id: '',
        name: '',
        context_length: 4096,
        temperature: 0.7,
        maxTokens: 2048,
        contextWindow: 4096,
        description: '',
        inputPrice: 0,
        outputPrice: 0,
        supportsPromptCache: true,
        supportsFunctionCalling: true,
        supportsVision: false
    }
}

export function getProviderOptions() {
    return [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'aws', label: 'AWS Bedrock' },
        { value: 'azure', label: 'Azure OpenAI' },
        { value: 'openrouter', label: 'OpenRouter' },
        { value: 'deepseek', label: 'DeepSeek' },
        { value: 'qwen', label: 'Qwen' },
        { value: 'mistral', label: 'Mistral' },
        { value: 'asksage', label: 'AskSage' }
    ]
} 