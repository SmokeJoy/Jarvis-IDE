import type { 
  ApiProvider,
  ApiConfiguration,
  ApiResponse,
  ApiStreamTextChunk,
  ApiStreamUsageChunk,
  ApiMessage
} from '../../src/shared/types/api.types';

export class MockProvider implements ApiProvider {
  private callCount = 0;
  private temporaryFailures = 0;
  private shouldError = false;
  private shouldNetworkError = false;
  private shouldRateLimitError = false;
  private config: ApiConfiguration;

  constructor() {
    this.config = {
      providerId: 'mock',
      apiKey: 'test-key',
      baseUrl: 'http://localhost:3000',
      modelName: 'test-model',
      maxTokens: 1000,
      temperature: 0.7
    };
  }

  async createChatCompletion(messages: ApiMessage[]): Promise<ApiResponse> {
    this.callCount++;

    if (this.shouldError) {
      throw new Error('Mock error');
    }

    if (this.shouldNetworkError) {
      throw new Error('Network error');
    }

    if (this.shouldRateLimitError) {
      throw new Error('Rate limit exceeded');
    }

    if (this.temporaryFailures > 0) {
      this.temporaryFailures--;
      throw new Error('Temporary failure');
    }

    if (this.config.apiKey === 'invalid-key') {
      throw new Error('Invalid API key');
    }

    return {
      id: 'mock-response-' + Date.now(),
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello, how can I help you?'
        }
      }],
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      },
      provider: 'mock',
      config: this.config,
      providerConfig: {}
    };
  }

  async createStreamingChatCompletion(
    messages: ApiMessage[],
    options: { 
      onChunk: (chunk: ApiStreamTextChunk | ApiStreamUsageChunk) => void 
    }
  ): Promise<void> {
    this.callCount++;

    if (this.shouldError) {
      throw new Error('Mock error');
    }

    // Simulate streaming text chunks
    const textChunks = ['1', ', ', '2', ', ', '3'];
    for (const text of textChunks) {
      options.onChunk({
        type: 'text',
        text,
        done: false
      });
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Send final usage chunk
    options.onChunk({
      type: 'usage',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      },
      done: true
    });
  }

  simulateTemporaryFailure(count: number): void {
    this.temporaryFailures = count;
  }

  simulateError(): void {
    this.shouldError = true;
  }

  simulateNetworkError(): void {
    this.shouldNetworkError = true;
  }

  simulateRateLimitError(): void {
    this.shouldRateLimitError = true;
  }

  getCallCount(): number {
    return this.callCount;
  }

  updateConfig(config: Partial<ApiConfiguration>): void {
    this.config = { ...this.config, ...config };
  }
} 