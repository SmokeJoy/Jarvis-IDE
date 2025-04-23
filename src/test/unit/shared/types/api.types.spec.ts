import { describe, it, expect } from 'vitest';
import type {
    ApiTransformer,
    ApiHandlerOptions,
    ApiStreamTextChunk,
    ApiStreamUsageChunk,
    ApiStreamErrorChunk,
    ApiStreamEndChunk,
    LLMProviderId,
    APIConfiguration,
    APIResponse
} from '@shared/types/api.types';

describe('API Types', () => {
    describe('ApiTransformer', () => {
        it('should correctly transform API response', () => {
            const transformer: ApiTransformer<string, number> = {
                transformResponse: (response: string) => parseInt(response, 10)
            };

            expect(transformer.transformResponse('42')).toBe(42);
        });
    });

    describe('ApiHandlerOptions', () => {
        it('should accept valid options', () => {
            const options: ApiHandlerOptions = {
                signal: new AbortController().signal,
                timeout: 5000
            };

            expect(options.timeout).toBe(5000);
            expect(options.signal).toBeInstanceOf(AbortSignal);
        });
    });

    describe('Stream Chunks', () => {
        it('should create valid text chunk', () => {
            const chunk: ApiStreamTextChunk = {
                type: 'text',
                text: 'test content'
            };

            expect(chunk.type).toBe('text');
            expect(chunk.text).toBe('test content');
        });

        it('should create valid usage chunk', () => {
            const chunk: ApiStreamUsageChunk = {
                type: 'usage',
                usage: {
                    promptTokens: 10,
                    completionTokens: 20,
                    totalTokens: 30
                }
            };

            expect(chunk.type).toBe('usage');
            expect(chunk.usage.totalTokens).toBe(30);
        });

        it('should create valid error chunk', () => {
            const chunk: ApiStreamErrorChunk = {
                type: 'error',
                error: new Error('test error')
            };

            expect(chunk.type).toBe('error');
            expect(chunk.error.message).toBe('test error');
        });

        it('should create valid end chunk', () => {
            const chunk: ApiStreamEndChunk = {
                type: 'end'
            };

            expect(chunk.type).toBe('end');
        });
    });

    describe('LLMProviderId', () => {
        it('should have valid provider IDs', () => {
            const validProviders: LLMProviderId[] = [
                'openai',
                'anthropic',
                'google',
                'ollama',
                'local'
            ];

            validProviders.forEach(provider => {
                expect(Object.values(LLMProviderId)).toContain(provider);
            });
        });
    });

    describe('APIConfiguration', () => {
        it('should create valid API configuration', () => {
            const config: APIConfiguration = {
                apiKey: 'test-key',
                baseUrl: 'https://api.test.com',
                providerId: LLMProviderId.OPENAI,
                options: {
                    timeout: 10000
                }
            };

            expect(config.apiKey).toBe('test-key');
            expect(config.baseUrl).toBe('https://api.test.com');
            expect(config.providerId).toBe(LLMProviderId.OPENAI);
            expect(config.options?.timeout).toBe(10000);
        });
    });

    describe('APIResponse', () => {
        it('should create valid API response', () => {
            const response: APIResponse<string> = {
                data: 'test response',
                status: 200,
                headers: {
                    'content-type': 'application/json'
                }
            };

            expect(response.data).toBe('test response');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/json');
        });

        it('should handle error in API response', () => {
            const response: APIResponse<string> = {
                data: 'error occurred',
                status: 400,
                error: new Error('Bad Request'),
                headers: {}
            };

            expect(response.status).toBe(400);
            expect(response.error?.message).toBe('Bad Request');
        });
    });
}); 
 