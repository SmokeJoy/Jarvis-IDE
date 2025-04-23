import { Anthropic } from '@anthropic-ai/sdk';
import { LLMHandler } from './LLMHandler';
import { ExtensionConfig } from '@shared/types/config';
import { LLMProvider } from '@shared/types/llm';

export class AnthropicHandler implements LLMHandler {
    public readonly provider: LLMProvider = 'anthropic';
    private client: Anthropic;

    constructor(private readonly config: ExtensionConfig) {
        if (!config.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        this.client = new Anthropic({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || undefined
        });
    }

    public async query(prompt: string): Promise<string> {
        try {
            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4096,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Anthropic API error:', error);
            throw new Error('Failed to get response from Anthropic API');
        }
    }

    public async streamQuery(prompt: string, onToken: (token: string) => void): Promise<void> {
        try {
            const stream = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4096,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                stream: true
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                    onToken(chunk.delta.text);
                }
            }
        } catch (error) {
            console.error('Anthropic API streaming error:', error);
            throw new Error('Failed to stream response from Anthropic API');
        }
    }

    public dispose(): void {
        // Nothing to dispose for Anthropic client
    }
} 