import { LLMProvider } from './llm';

/**
 * Extension settings
 */
export interface ExtensionSettings {
    /**
     * Theme preference
     */
    theme: 'light' | 'dark' | 'system';

    /**
     * Font size for the UI
     */
    fontSize: number;

    /**
     * Whether to show notifications
     */
    enableNotifications: boolean;

    /**
     * Interface language
     */
    language: string;

    /**
     * Default LLM model to use
     */
    defaultModel: string;

    /**
     * API keys for different providers
     */
    apiKeys: Record<LLMProvider, string>;

    /**
     * Whether to use documentation in responses
     */
    use_docs: boolean;

    /**
     * Whether to optimize for code generation
     */
    coder_mode: boolean;

    /**
     * Whether to use multiple AI agents
     */
    multi_agent: boolean;

    /**
     * Custom instructions for the AI
     */
    customInstructions?: string;

    /**
     * Telemetry settings
     */
    telemetry: {
        enabled: boolean;
        anonymousUsageStats: boolean;
    };
}

/**
 * Prompt profile
 */
export interface PromptProfile {
    /**
     * Unique identifier for the profile
     */
    id: string;

    /**
     * Display name of the profile
     */
    name: string;

    /**
     * System prompt for the profile
     */
    systemPrompt: string;

    /**
     * Whether this is the active profile
     */
    isActive: boolean;

    /**
     * Model to use with this profile
     */
    modelId?: string;

    /**
     * Additional profile-specific settings
     */
    settings?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };

    /**
     * Optional metadata
     */
    metadata?: Record<string, unknown>;
}
