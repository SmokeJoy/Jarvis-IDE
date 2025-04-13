import { z } from 'zod';
import { createSafeMessage } from "../shared/types/message";

export const OpenRouterRequestSchema = z.object({
  model: z.string().describe('Modello OpenRouter da utilizzare'),
  provider: z.literal('openrouter'),
  messages: z.array(
    z.object(createSafeMessage({role: z.enum(['user', 'assistant', 'system']), content: z.string()}))
  ),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  _headers: z
    .object({
      'HTTP-Referer': z.string().url(),
      'X-Title': z.string(),
      Authorization: z.string(),
    })
    .describe('Intestazioni richieste da OpenRouter API'),
});

export type OpenRouterRequest = z.infer<typeof OpenRouterRequestSchema>;

export const OpenRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object(createSafeMessage({role: z.string(), content: z.string()})),
      finish_reason: z.string(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
  }),
});

export type OpenRouterResponse = z.infer<typeof OpenRouterResponseSchema>;

export const isOpenRouterRequest = (data: unknown): data is OpenRouterRequest => {
  return OpenRouterRequestSchema.safeParse(data).success;
};

export const isOpenRouterResponse = (data: unknown): data is OpenRouterResponse => {
  return OpenRouterResponseSchema.safeParse(data).success;
};
