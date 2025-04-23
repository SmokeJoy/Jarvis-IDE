import { z } from 'zod';
import { ModelInfo, ApiHandlerOptions } from '../../../shared/types/api.types';

// Schema per ModelInfo
export const modelInfoSchema = z.object({
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  thinkingBudgetTokens: z.number().optional(),
});

// Schema principale per le opzioni Anthropic
export const anthropicOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  anthropicModelId: z.string().min(1),
  modelInfo: z.object({
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(1).optional(),
  }).optional(),
});

// Tipo TypeScript inferito dallo schema
export type AnthropicOptions = z.infer<typeof anthropicOptionsSchema> & ApiHandlerOptions;

// Schema per la risposta di utilizzo
export const anthropicUsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
  cache_creation_input_tokens: z.number().optional(),
  cache_read_input_tokens: z.number().optional(),
});

export type AnthropicUsage = z.infer<typeof anthropicUsageSchema>;

// Schema per gli eventi di streaming
export const anthropicStreamEventSchema = z.object({
  type: z.enum([
    'message_start',
    'message_delta',
    'message_stop',
    'content_block_start',
    'content_block_delta',
    'content_block_stop'
  ]),
  message: z.object({
    usage: anthropicUsageSchema.optional(),
  }).optional(),
  usage: z.object({
    output_tokens: z.number(),
  }).optional(),
  content_block: z.object({
    type: z.enum(['thinking', 'redacted_thinking', 'text']),
    thinking: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  delta: z.object({
    type: z.enum(['thinking_delta', 'text_delta', 'signature_delta']),
    thinking: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  index: z.number().optional(),
});

export const AnthropicUsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number()
});

export type AnthropicUsage = z.infer<typeof AnthropicUsageSchema>;

export const AnthropicOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().optional(),
  anthropicModelId: z.string(),
  modelInfo: z.custom<ModelInfo>().optional()
});

export type AnthropicOptions = z.infer<typeof AnthropicOptionsSchema>;

export interface AnthropicOptions {
  apiKey: string;
  anthropicModelId: string;
  modelInfo?: ModelInfo;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
} 