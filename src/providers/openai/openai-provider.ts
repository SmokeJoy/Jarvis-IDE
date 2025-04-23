import { ApiHandlerOptions, ApiStreamChunk, ApiStreamTextChunk, ApiStreamUsageChunk, LLMModel, LLMProviderId } from '@shared/types/api.types';
import { openaiConfig } from './config';

const OPENAI_API_URL = 'https://api.openai.com/v1';

export async function fetchOpenAIModels(apiKey: string, organizationId?: string): Promise<LLMModel[]> {
  try {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    if (organizationId) {
      headers['OpenAI-Organization'] = organizationId;
    }

    const response = await fetch(`${OPENAI_API_URL}/models`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter for GPT models only
    return data.data
      .filter((model: any) => model.id.startsWith('gpt-'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        provider: LLMProviderId.OpenAI,
        contextWindow: model.context_window || 4096,
        deprecated: model.deprecated || false
      }));
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    throw error;
  }
}

export async function sendOpenAIMessage(options: ApiHandlerOptions): Promise<ReadableStream<ApiStreamChunk>> {
  const { apiKey, organizationId, model, messages, functions, temperature = 0.7, maxTokens } = options;

  const headers: HeadersInit = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  if (organizationId) {
    headers['OpenAI-Organization'] = organizationId;
  }

  const body: any = {
    model,
    messages,
    temperature,
    stream: true
  };

  if (maxTokens) {
    body.max_tokens = parseInt(maxTokens);
  }

  if (functions) {
    body.functions = functions;
  }

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk
              .split('\n')
              .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

            for (const line of lines) {
              const cleanLine = line.replace(/^data: /, '');
              if (!cleanLine) continue;

              try {
                const json = JSON.parse(cleanLine);
                const delta = json.choices[0]?.delta;

                if (delta?.content) {
                  const textChunk: ApiStreamTextChunk = {
                    type: 'text',
                    content: delta.content
                  };
                  controller.enqueue(textChunk);
                }

                if (json.usage) {
                  const usageChunk: ApiStreamUsageChunk = {
                    type: 'usage',
                    promptTokens: json.usage.prompt_tokens,
                    completionTokens: json.usage.completion_tokens,
                    totalTokens: json.usage.total_tokens
                  };
                  controller.enqueue(usageChunk);
                }

                if (delta?.function_call) {
                  controller.enqueue({
                    type: 'function_call',
                    name: delta.function_call.name,
                    arguments: delta.function_call.arguments
                  });
                }
              } catch (e) {
                console.error('Error parsing OpenAI stream chunk:', e);
                continue;
              }
            }
          }
        } catch (error) {
          console.error('Error processing OpenAI stream:', error);
          controller.error(error);
        }
      }
    });
  } catch (error) {
    console.error('Error sending message to OpenAI:', error);
    throw error;
  }
} 