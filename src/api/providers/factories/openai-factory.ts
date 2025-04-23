import OpenAI, { AzureOpenAI } from 'openai';
import { ApiHandlerOptions } from '../../../shared/types/api.types';
import { openAiOptionsSchema } from '../schemas/openai.schema';
import { azureOpenAiDefaultApiVersion } from '../../../shared/api';
import { logger } from '../../../utils/logger';

/**
 * Factory per la creazione di un client OpenAI o AzureOpenAI
 * Valida le opzioni e crea il client appropriato
 */
export const createOpenAIClient = (options: ApiHandlerOptions): OpenAI | AzureOpenAI => {
  try {
    // Valida le opzioni con lo schema Zod
    const validatedOptions = openAiOptionsSchema.parse(options);
    
    // Determina se usare Azure OpenAI
    const isAzure = !!(validatedOptions.azureApiVersion || 
      validatedOptions.openAiBaseUrl?.toLowerCase().includes('azure.com'));

    logger.debug(
      `[OpenAIFactory] Creating ${isAzure ? 'Azure' : 'OpenAI'} client. BaseURL: ${validatedOptions.openAiBaseUrl || 'default'}`
    );

    if (isAzure) {
      if (!validatedOptions.openAiBaseUrl) {
        throw new Error('Azure OpenAI requires baseURL');
      }

      return new AzureOpenAI({
        baseURL: validatedOptions.openAiBaseUrl,
        apiKey: validatedOptions.openAiApiKey,
        apiVersion: validatedOptions.azureApiVersion || azureOpenAiDefaultApiVersion,
        defaultQuery: { 'api-version': validatedOptions.azureApiVersion || azureOpenAiDefaultApiVersion },
        defaultHeaders: { 'api-key': validatedOptions.openAiApiKey }
      });
    }

    return new OpenAI({
      baseURL: validatedOptions.openAiBaseUrl,
      apiKey: validatedOptions.openAiApiKey,
      timeout: validatedOptions.timeout || 60000,
      maxRetries: validatedOptions.maxRetries || 3
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[OpenAIFactory] Failed to create client: ${errorMessage}`);
    throw error;
  }
}; 