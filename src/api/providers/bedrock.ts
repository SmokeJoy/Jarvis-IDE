import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';
import { ApiHandler } from '../index';
import { convertToR1Format } from '../transform/r1-format';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { ApiStream, ApiStreamChunk } from '../../types/global';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseStreamCommand,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { bedrockDefaultModelId, BedrockModelId, bedrockModels } from '../../shared/api.types';
import { ChatCompletionContentPartText } from '../transform/r1-format';
import { ChatCompletionMessageParam } from '../../types/provider-types/openai-types';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { ChatMessage } from '../../types/chat.types';
import { createSafeMessage } from "../../shared/types/message";

export interface BedrockConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface BedrockMessage {
  role: ConversationRole;
  content: string | Array<{ type: string; text: string }>;
}

export class BedrockProvider {
  constructor(
    private config: BedrockConfig,
    private modelId: string
  ) {}

  public async chat(messages: BedrockMessage[], signal?: AbortSignal): Promise<ApiStream> {
    // Implementazione del metodo chat per Bedrock
    throw new Error('Not implemented');
  }

  public async streamChat(
    messages: BedrockMessage[],
    signal?: AbortSignal
  ): Promise<AsyncGenerator<ApiStreamChunk>> {
    // Implementazione del metodo streamChat per Bedrock
    throw new Error('Not implemented');
  }
}

// https://docs.anthropic.com/en/api/claude-on-amazon-bedrock
export class AwsBedrockHandler implements ApiHandler {
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
  }

  async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
    const retries = 2;
    const delay = 500;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // cross region inference requires prefixing the model id with the region
        const modelId = await this.getModelId();
        const model = this.getModel();

        // Check if this is an Amazon Nova model
        if (modelId.includes('amazon.nova')) {
          yield* this.createNovaMessage(systemPrompt, messages, modelId, model);
          return;
        }

        // Check if this is a Deepseek model
        if (modelId.includes('deepseek')) {
          yield* this.createDeepseekMessage(systemPrompt, messages, modelId, model);
          return;
        }

        const budget_tokens = this.options.thinkingBudgetTokens || 0;
        const reasoningOn = modelId.includes('3-7') && budget_tokens !== 0 ? true : false;

        // Get model info and message indices for caching
        const userMsgIndices = messages.reduce(
          (acc, msg, index) => (msg.role === 'user' ? [...acc, index] : acc),
          [] as number[]
        );
        const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1;
        const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1;

        // Create anthropic client, using sessions created or renewed after this handler's
        // initialization, and allowing for session renewal if necessary as well
        const client = await this.getAnthropicClient();

        const stream = await client.messages.create({
          model: modelId,
          max_tokens: model.info.maxTokens || 8192,
          thinking: reasoningOn ? { type: 'enabled', budget_tokens: budget_tokens } : undefined,
          temperature: reasoningOn ? undefined : 0,
          system: [
            {
              text: systemPrompt,
              type: 'text',
              ...(this.options.awsBedrockUsePromptCache === true && {
                cache_control: { type: 'ephemeral' },
              }),
            },
          ],
          messages: messages.map((message, index) => {
            if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
              return {
                ...message,
                content:
                  typeof message.content === 'string'
                    ? [
                        {
                          type: 'text',
                          text: message.content,
                          ...(this.options.awsBedrockUsePromptCache === true && {
                            cache_control: { type: 'ephemeral' },
                          }),
                        },
                      ]
                    : message.content.map((content, contentIndex) =>
                        contentIndex === message.content.length - 1
                          ? {
                              ...content,
                              ...(this.options.awsBedrockUsePromptCache === true && {
                                cache_control: { type: 'ephemeral' },
                              }),
                            }
                          : content
                      ),
              };
            }
            return message;
          }),
          stream: true,
        });

        for await (const chunk of stream) {
          if (chunk && typeof chunk === 'object' && 'type' in chunk) {
            switch (chunk.type) {
              case 'message_start':
                if (
                  chunk.message &&
                  typeof chunk.message === 'object' &&
                  'usage' in chunk.message
                ) {
                  const usage = chunk.message.usage || {};
                  yield {
                    type: 'usage',
                    inputTokens: usage.input_tokens || 0,
                    outputTokens: usage.output_tokens || 0,
                    cacheWriteTokens: usage.cache_creation_input_tokens || undefined,
                    cacheReadTokens: usage.cache_read_input_tokens || undefined,
                  };
                }
                break;
              case 'message_delta':
                if (chunk.usage && typeof chunk.usage === 'object') {
                  yield {
                    type: 'usage',
                    inputTokens: 0,
                    outputTokens: chunk.usage.output_tokens || 0,
                  };
                }
                break;
              case 'content_block_start':
                if (
                  chunk.content_block &&
                  typeof chunk.content_block === 'object' &&
                  'type' in chunk.content_block
                ) {
                  switch (chunk.content_block.type) {
                    case 'thinking':
                      yield {
                        type: 'reasoning',
                        reasoning: chunk.content_block.thinking || '',
                      };
                      break;
                    case 'redacted_thinking':
                      // Handle redacted thinking blocks - we still mark it as reasoning
                      // but note that the content is encrypted
                      yield {
                        type: 'reasoning',
                        reasoning: '[Redacted thinking block]',
                      };
                      break;
                    case 'text':
                      if (typeof chunk.index === 'number' && chunk.index > 0) {
                        yield {
                          type: 'text',
                          text: '\n',
                        };
                      }
                      if (chunk.content_block && 'text' in chunk.content_block) {
                        yield {
                          type: 'text',
                          text: chunk.content_block.text || '',
                        };
                      }
                      break;
                  }
                }
                break;
              case 'content_block_delta':
                if (chunk.delta && typeof chunk.delta === 'object' && 'type' in chunk.delta) {
                  switch (chunk.delta.type) {
                    case 'thinking_delta':
                      if ('thinking' in chunk.delta) {
                        yield {
                          type: 'reasoning',
                          reasoning: chunk.delta.thinking || '',
                        };
                      }
                      break;
                    case 'text_delta':
                      if ('text' in chunk.delta) {
                        yield {
                          type: 'text',
                          text: chunk.delta.text || '',
                        };
                      }
                      break;
                  }
                }
                break;
            }
          }
        }
        return;
      } catch (error) {
        attempt++;
        if (attempt > retries) {
          console.error(`[bedrock] Errore definitivo dopo ${retries} tentativi:`, error);
          throw error;
        }
        console.warn(`[bedrock] Tentativo ${attempt} fallito, nuovo tentativo tra ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  getModel(): { id: BedrockModelId; info: ModelInfo } {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in bedrockModels) {
      const id = modelId as BedrockModelId;
      return { id, info: bedrockModels[id] };
    }
    return {
      id: bedrockDefaultModelId,
      info: bedrockModels[bedrockDefaultModelId],
    };
  }

  // Default AWS region
  private static readonly DEFAULT_REGION = 'us-east-1';

  /**
   * Gets AWS credentials using the provider chain
   * Centralizes credential retrieval logic for all AWS services
   */
  private async getAwsCredentials(): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  }> {
    try {
      const credentials = await fromNodeProviderChain()();
      return {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Errore nel recupero delle credenziali AWS:', error.message);
      }
      throw new Error('Impossibile recuperare le credenziali AWS');
    }
  }

  /**
   * Gets the AWS region to use, with fallback to default
   */
  private getRegion(): string {
    return this.options.awsRegion || AwsBedrockHandler.DEFAULT_REGION;
  }

  /**
   * Creates a BedrockRuntimeClient with the appropriate credentials
   */
  private async getBedrockClient(): Promise<BedrockRuntimeClient> {
    const credentials = await this.getAwsCredentials();
    const region = this.getRegion();

    return new BedrockRuntimeClient({
      region,
      credentials,
    });
  }

  /**
   * Creates an AnthropicBedrock client with the appropriate credentials
   */
  private async getAnthropicClient(): Promise<AnthropicBedrock> {
    const credentials = await this.getAwsCredentials();
    const region = this.getRegion();

    return new AnthropicBedrock({
      region,
      credentials,
    });
  }

  /**
   * Gets the appropriate model ID, accounting for cross-region inference if enabled
   */
  async getModelId(): Promise<string> {
    const model = this.getModel();
    const region = this.getRegion();
    return `${region}.${model.id}`;
  }

  private static async withTempEnv<R>(updateEnv: () => void, fn: () => Promise<R>): Promise<R> {
    const originalEnv = { ...process.env };
    try {
      updateEnv();
      return await fn();
    } finally {
      process.env = originalEnv;
    }
  }

  private static setEnv(key: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  /**
   * Creates a message using the Deepseek R1 model through AWS Bedrock
   */
  private async *createDeepseekMessage(
    systemPrompt: string,
    messages: ChatMessage[],
    modelId: string,
    model: { id: BedrockModelId; info: ModelInfo }
  ): ApiStream {
    // Get Bedrock client with proper credentials
    const client = await this.getBedrockClient();

    // Format prompt for DeepSeek R1 according to documentation
    const formattedPrompt = this.formatDeepseekR1Prompt(systemPrompt, messages);

    // Prepare the request based on DeepSeek R1's expected format
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: formattedPrompt,
        max_tokens: model.info.maxTokens || 8000,
        temperature: 0,
      }),
    });

    // Track token usage
    const inputTokenEstimate = this.estimateInputTokens(systemPrompt, messages);
    let outputTokens = 0;
    let isFirstChunk = true;
    let accumulatedTokens = 0;
    const TOKEN_REPORT_THRESHOLD = 100; // Report usage after accumulating this many tokens

    // Execute the streaming request
    const response = await client.send(command);

    if (response && response.body) {
      for await (const chunk of response.body) {
        if (chunk && typeof chunk === 'object' && 'chunk' in chunk && chunk.chunk?.bytes) {
          try {
            // Parse the response chunk
            const decodedChunk = new TextDecoder().decode(chunk.chunk.bytes);
            const parsedChunk = JSON.parse(decodedChunk);

            // Report usage on first chunk
            if (isFirstChunk) {
              isFirstChunk = false;
              const totalCost = calculateApiCostOpenAI(model.info, inputTokenEstimate, 0, 0, 0);
              yield {
                type: 'usage',
                inputTokens: inputTokenEstimate,
                outputTokens: 0,
                totalCost: totalCost,
              };
            }

            // Handle DeepSeek R1 response format
            if (parsedChunk && typeof parsedChunk === 'object') {
              if (
                'choices' in parsedChunk &&
                Array.isArray(parsedChunk.choices) &&
                parsedChunk.choices.length > 0
              ) {
                // For non-streaming response (full response)
                const choice = parsedChunk.choices[0];
                const text = choice && 'text' in choice ? choice.text : undefined;
                if (text) {
                  const chunkTokens = this.estimateTokenCount(text);
                  outputTokens += chunkTokens;
                  accumulatedTokens += chunkTokens;

                  yield {
                    type: 'text',
                    text: text,
                  };

                  if (accumulatedTokens >= TOKEN_REPORT_THRESHOLD) {
                    const totalCost = calculateApiCostOpenAI(
                      model.info,
                      0,
                      accumulatedTokens,
                      0,
                      0
                    );
                    yield {
                      type: 'usage',
                      inputTokens: 0,
                      outputTokens: accumulatedTokens,
                      totalCost: totalCost,
                    };
                    accumulatedTokens = 0;
                  }
                }
              } else if (
                'delta' in parsedChunk &&
                typeof parsedChunk.delta === 'object' &&
                parsedChunk.delta &&
                'text' in parsedChunk.delta
              ) {
                // For streaming response (delta updates)
                const text = parsedChunk.delta.text;
                if (text) {
                  const chunkTokens = this.estimateTokenCount(text);
                  outputTokens += chunkTokens;
                  accumulatedTokens += chunkTokens;

                  yield {
                    type: 'text',
                    text: text,
                  };
                  // Report aggregated token usage only when threshold is reached
                  if (accumulatedTokens >= TOKEN_REPORT_THRESHOLD) {
                    const totalCost = calculateApiCostOpenAI(
                      model.info,
                      0,
                      accumulatedTokens,
                      0,
                      0
                    );
                    yield {
                      type: 'usage',
                      inputTokens: 0,
                      outputTokens: accumulatedTokens,
                      totalCost: totalCost,
                    };
                    accumulatedTokens = 0;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error parsing Deepseek response chunk:', error);
            // Propagate the error by yielding a text response with error information
            yield {
              type: 'text',
              text: `[ERROR] Failed to parse Deepseek response: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        }
      }

      // Report any remaining accumulated tokens at the end of the stream
      if (accumulatedTokens > 0) {
        const totalCost = calculateApiCostOpenAI(model.info, 0, accumulatedTokens, 0, 0);
        yield {
          type: 'usage',
          inputTokens: 0,
          outputTokens: accumulatedTokens,
          totalCost: totalCost,
        };
      }

      // Add final total cost calculation that includes both input and output tokens
      const finalTotalCost = calculateApiCostOpenAI(
        model.info,
        inputTokenEstimate,
        outputTokens,
        0,
        0
      );
      yield {
        type: 'usage',
        inputTokens: inputTokenEstimate,
        outputTokens: outputTokens,
        totalCost: finalTotalCost,
      };
    }
  }

  /**
   * Formats prompt for DeepSeek R1 model according to documentation
   * First uses convertToR1Format to merge consecutive messages with the same role,
   * then converts to the string format that DeepSeek R1 expects
   */
  private formatDeepseekR1Prompt(systemPrompt: string, messages: ChatMessage[]): string {
    // First use convertToR1Format to merge consecutive messages with the same role
    const r1Messages = convertToR1Format([createSafeMessage({role: 'user', content: systemPrompt}), ...messages]);

    // Then convert to the special string format expected by DeepSeek R1
    let combinedContent = '';

    for (const message of r1Messages) {
      let content = '';

      if (message.content) {
        if (typeof message.content === 'string') {
          content = message.content;
        } else {
          // Extract text content from message parts
          content = (message.content as ChatCompletionContentPartText[])
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('\n');
        }
      }

      combinedContent +=
        message.role === 'user' ? 'User: ' + content + '\n' : 'Assistant: ' + content + '\n';
    }

    // Format according to DeepSeek R1's expected prompt format
    return `
${combinedContent}
`;
  }

  /**
   * Estimates token count based on text length (approximate)
   * Note: This is a rough estimation, as the actual token count depends on the tokenizer
   */
  private estimateInputTokens(systemPrompt: string, messages: ChatMessage[]): number {
    // For Deepseek R1, we estimate the token count of the formatted prompt
    // The formatted prompt includes special tokens and consistent formatting
    const formattedPrompt = this.formatDeepseekR1Prompt(systemPrompt, messages);
    return Math.ceil(formattedPrompt.length / 4);
  }

  /**
   * Estimates token count for a text string
   */
  private estimateTokenCount(text: string): number {
    // Approximate 4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Creates a message using Amazon Nova models through AWS Bedrock
   * Implements support for Nova Micro, Nova Lite, and Nova Pro models
   */
  private async *createNovaMessage(
    systemPrompt: string,
    messages: ChatMessage[],
    modelId: string,
    model: { id: BedrockModelId; info: ModelInfo }
  ): ApiStream {
    // Get Bedrock client with proper credentials
    const client = await this.getBedrockClient();

    // Format messages for Nova model
    const formattedMessages = this.formatNovaMessages(messages);

    // Prepare request for Nova model
    const command = new ConverseStreamCommand({
      modelId: modelId,
      messages: formattedMessages,
      system: systemPrompt ? [{ text: systemPrompt }] : undefined,
      inferenceConfig: {
        maxTokens: model.info.maxTokens || 5000,
        temperature: 0,
        // topP: 0.9, // Alternative: use topP instead of temperature
      },
    });

    // Execute the streaming request and handle response
    try {
      const response = await client.send(command);

      if (response && response.stream) {
        let hasReportedInputTokens = false;

        for await (const chunk of response.stream) {
          // Handle metadata events with token usage information
          if (
            chunk &&
            typeof chunk === 'object' &&
            'metadata' in chunk &&
            chunk.metadata &&
            'usage' in chunk.metadata
          ) {
            // Report complete token usage from the model itself
            const inputTokens = chunk.metadata.usage.inputTokens || 0;
            const outputTokens = chunk.metadata.usage.outputTokens || 0;
            yield {
              type: 'usage',
              inputTokens,
              outputTokens,
              totalCost: calculateApiCostOpenAI(model.info, inputTokens, outputTokens, 0, 0),
            };
            hasReportedInputTokens = true;
          }

          // Handle content delta (text generation) in modo sicuro
          if (
            chunk &&
            typeof chunk === 'object' &&
            'contentBlockDelta' in chunk &&
            chunk.contentBlockDelta &&
            typeof chunk.contentBlockDelta === 'object' &&
            'delta' in chunk.contentBlockDelta &&
            chunk.contentBlockDelta.delta
          ) {
            const delta = chunk.contentBlockDelta.delta;
            if (typeof delta === 'object' && 'text' in delta && delta.text) {
              yield {
                type: 'text',
                text: delta.text,
              };
            }

            // Handle reasoning content if present
            if (
              typeof delta === 'object' &&
              'reasoningContent' in delta &&
              delta.reasoningContent &&
              typeof delta.reasoningContent === 'object' &&
              'text' in delta.reasoningContent &&
              delta.reasoningContent.text
            ) {
              yield {
                type: 'reasoning',
                reasoning: delta.reasoningContent.text,
              };
            }
          }

          // Handle errors
          if (chunk && typeof chunk === 'object') {
            if ('internalServerException' in chunk && chunk.internalServerException) {
              yield {
                type: 'text',
                text: `[ERROR] Internal server error: ${chunk.internalServerException.message || 'Unknown error'}`,
              };
            } else if ('modelStreamErrorException' in chunk && chunk.modelStreamErrorException) {
              yield {
                type: 'text',
                text: `[ERROR] Model stream error: ${chunk.modelStreamErrorException.message || 'Unknown error'}`,
              };
            } else if ('validationException' in chunk && chunk.validationException) {
              yield {
                type: 'text',
                text: `[ERROR] Validation error: ${chunk.validationException.message || 'Unknown error'}`,
              };
            } else if ('throttlingException' in chunk && chunk.throttlingException) {
              yield {
                type: 'text',
                text: `[ERROR] Throttling error: ${chunk.throttlingException.message || 'Unknown error'}`,
              };
            } else if (
              'serviceUnavailableException' in chunk &&
              chunk.serviceUnavailableException
            ) {
              yield {
                type: 'text',
                text: `[ERROR] Service unavailable: ${chunk.serviceUnavailableException.message || 'Unknown error'}`,
              };
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing Nova model response:', error);
      yield {
        type: 'text',
        text: `[ERROR] Failed to process Nova response: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Formats messages for Amazon Nova models according to the SDK specification
   */
  private formatNovaMessages(
    messages: ChatMessage[]
  ): { role: ConversationRole; content: any[] }[] {
    return messages.map((message) => {
      // Determine role (user or assistant)
      const role = message.role === 'user' ? ConversationRole.USER : ConversationRole.ASSISTANT;

      // Process content based on type
      let content: any[] = [];

      if (typeof message.content === 'string') {
        // Simple text content
        content = [{ text: message.content }];
      } else if (Array.isArray(message.content)) {
        // Convert Anthropic content format to Nova content format
        content = message.content
          .map((item) => {
            // Text content
            if (item.type === 'text') {
              return { text: item.text };
            }

            // Image content
            if (item.type === 'image') {
              // Handle different image source formats
              let imageData: Uint8Array;
              let format = 'jpeg'; // default format

              // Extract format from media_type if available
              if (item.source.type === 'base64' && item.source.media_type) {
                // Extract format from media_type (e.g., "image/jpeg" -> "jpeg")
                const formatMatch = item.source.media_type.match(/image\/(\w+)/);
                if (formatMatch && formatMatch[1]) {
                  format = formatMatch[1];
                  // Ensure format is one of the allowed values
                  if (!['png', 'jpeg', 'gif', 'webp'].includes(format)) {
                    format = 'jpeg'; // Default to jpeg if not supported
                  }
                }
              }

              // Get image data
              try {
                if (item.source.type === 'base64') {
                  // Handle base64 encoded data
                  const base64Data = item.source.data.replace(/^data:image\/\w+;base64,/, '');
                  imageData = new Uint8Array(Buffer.from(base64Data, 'base64'));
                } else if (item.source.type === 'url') {
                  // @ts-ignore - URLImageSource can have data in runtime
                  if (typeof item.source.data === 'string') {
                    // @ts-ignore - URLImageSource can have data in runtime
                    const base64Data = item.source.data.replace(/^data:image\/\w+;base64,/, '');
                    imageData = new Uint8Array(Buffer.from(base64Data, 'base64'));
                    // @ts-ignore - URLImageSource can have data in runtime
                  } else if (item.source.data && typeof item.source.data === 'object') {
                    // @ts-ignore - URLImageSource can have data in runtime
                    imageData = new Uint8Array(Buffer.from(item.source.data as any));
                  } else {
                    console.error('URL image source without usable data');
                    return null;
                  }
                } else {
                  console.error('Unsupported image source type');
                  return null;
                }
              } catch (error) {
                console.error('Could not convert image data to Uint8Array:', error);
                return null; // Skip this item if conversion fails
              }

              return {
                image: {
                  format,
                  source: {
                    bytes: imageData,
                  },
                },
              };
            }

            // Return null for unsupported content types
            return null;
          })
          .filter(Boolean); // Remove any null items
      }

      // Return formatted message
      return {
        role,
        content,
      };
    });
  }

  async *streamChat(messages: ChatCompletionMessageParam[]) {
    const anthropicMessages = messages.map((msg) => (createSafeMessage({role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content}))) as ChatMessage[];

    const command = new InvokeModelCommand({
      modelId: this.getModelId(),
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    try {
      const response = await this.getBedrockClient().send(command);
      if (response && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (
                parsed &&
                typeof parsed === 'object' &&
                'type' in parsed &&
                parsed.type === 'content_block_delta' &&
                'delta' in parsed &&
                parsed.delta &&
                'text' in parsed.delta &&
                parsed.delta.text
              ) {
                yield parsed.delta.text;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streamChat:', error);
      throw error;
    }
  }

  async chat(messages: ChatCompletionMessageParam[]) {
    const anthropicMessages = messages.map((msg) => (createSafeMessage({role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content}))) as ChatMessage[];

    const command = new InvokeModelCommand({
      modelId: this.getModelId(),
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: anthropicMessages,
      }),
    });

    try {
      const response = await this.getBedrockClient().send(command);
      if (response && response.body) {
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        if (
          responseBody &&
          typeof responseBody === 'object' &&
          'content' in responseBody &&
          Array.isArray(responseBody.content) &&
          responseBody.content.length > 0 &&
          typeof responseBody.content[0] === 'object' &&
          'text' in responseBody.content[0]
        ) {
          return convertToR1Format([
            createSafeMessage({role: 'assistant', content: responseBody.content[0].text}),
          ])[0];
        }
        // Se non riusciamo a estrarre il testo, restituiamo un messaggio vuoto
        return createSafeMessage({role: 'assistant', content: ''});
      }
      return createSafeMessage({role: 'assistant', content: ''});
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }
}
