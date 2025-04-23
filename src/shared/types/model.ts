import { LLMProvider } from './llm';

/**
 * Information about an LLM model
 */
export interface ModelInfo {
    /**
     * Unique identifier for the model
     */
    id: string;

    /**
     * Display name of the model
     */
    name: string;

    /**
     * Provider of the model
     */
    provider: LLMProvider;

    /**
     * Maximum number of tokens the model can process
     */
    maxTokens: number;

    /**
     * Type of tokenizer used by the model
     */
    tokenizer: string;

    /**
     * Whether the model is currently available
     */
    isAvailable?: boolean;

    /**
     * Model capabilities
     */
    capabilities?: {
        /**
         * Whether the model supports streaming responses
         */
        streaming?: boolean;

        /**
         * Whether the model supports function calling
         */
        functionCalling?: boolean;

        /**
         * Whether the model supports vision/image input
         */
        vision?: boolean;

        /**
         * Whether the model is optimized for code generation
         */
        codeGeneration?: boolean;
    };

    /**
     * Model pricing information
     */
    pricing?: {
        /**
         * Cost per 1K input tokens
         */
        inputTokenCost: number;

        /**
         * Cost per 1K output tokens
         */
        outputTokenCost: number;

        /**
         * Currency for the costs (e.g., 'USD')
         */
        currency: string;
    };

    /**
     * Additional model-specific metadata
     */
    metadata?: Record<string, unknown>;
} 