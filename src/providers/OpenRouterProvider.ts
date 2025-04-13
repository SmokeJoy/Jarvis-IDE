import { OpenRouterRequest, OpenRouterResponse, isOpenRouterRequest } from './openrouter-message';
import { BaseLLMProvider } from './BaseProvider';
import { LLMRequest, LLMResponse } from '../../shared/types/llm.types';
import { createSafeMessage } from "../shared/types/message";

export class OpenRouterProvider extends BaseLLMProvider {
  static providerId = 'openrouter' as const;

  async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    if (!isOpenRouterRequest(request)) {
      throw new Error('Invalid OpenRouter request format');
    }

    const validatedRequest = OpenRouterRequestSchema.parse(request);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validatedRequest._headers.Authorization}`,
          'HTTP-Referer': validatedRequest._headers['HTTP-Referer'],
          'X-Title': validatedRequest._headers['X-Title'],
        },
        body: JSON.stringify({
          model: validatedRequest.model,
          messages: validatedRequest.messages,
          temperature: validatedRequest.temperature,
          max_tokens: validatedRequest.max_tokens,
        }),
      });

      const data = await response.json();
      const parsedResponse = OpenRouterResponseSchema.parse(data);

      return {
        success: true,
        choices: parsedResponse.choices.map((choice) => ({
          message: createSafeMessage({role: choice.message.role, content: choice.message.content}),
          finishReason: choice.finish_reason,
        })),
        usage: parsedResponse.usage,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): LLMResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'OPENROUTER_API_ERROR',
    };
  }
}
