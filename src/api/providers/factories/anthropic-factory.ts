import Anthropic from '@anthropic-ai/sdk';
import { ApiHandlerOptions } from '../../../shared/types/api.types';
import { anthropicOptionsSchema } from '../schemas/anthropic.schema';
import { logger } from '../../../utils/logger';

export function createAnthropicClient(options: ApiHandlerOptions): Anthropic {
  try {
    // Valida le opzioni usando lo schema Zod
    const validatedOptions = anthropicOptionsSchema.parse(options);

    // Crea il client Anthropic con le opzioni validate
    const client = new Anthropic({
      apiKey: validatedOptions.anthropicApiKey,
      baseURL: validatedOptions.anthropicBaseUrl,
    });

    return client;
  } catch (error) {
    logger.error('Failed to create Anthropic client:', error);
    throw new Error('Failed to initialize Anthropic client: ' + (error instanceof Error ? error.message : String(error)));
  }
} 