import { LLMProvider } from './llm';

/**
 * Configuration for the Jarvis IDE extension
 */
export interface ExtensionConfig {
    /**
     * The LLM provider to use
     */
    provider: LLMProvider | string;

    /**
     * The API key for the LLM provider
     */
    apiKey: string;

    /**
     * Optional base URL for the API
     */
    baseUrl?: string;

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
} 