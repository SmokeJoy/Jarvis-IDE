import { ExtensionConfig } from '@shared/types/config';
import { LLMProvider } from '@shared/types/llm';

export interface LLMHandler {
    readonly provider: LLMProvider;
    
    /**
     * Send a query to the LLM and get a response
     * @param prompt The prompt to send to the LLM
     * @returns The LLM's response
     */
    query(prompt: string): Promise<string>;

    /**
     * Send a query to the LLM and receive tokens as they are generated
     * @param prompt The prompt to send to the LLM
     * @param onToken Callback function to handle each token as it arrives
     */
    streamQuery(prompt: string, onToken: (token: string) => void): Promise<void>;

    /**
     * Clean up any resources used by the handler
     */
    dispose(): void;
} 