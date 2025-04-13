import { ModelInfo } from '../../shared/api';
import { OpenAITransformer } from './openai-format';
import { ApiStream } from './stream';
import OpenAI from 'openai';
import { ChatMessage } from '../../types/ChatMessage';
import { logger } from '../../utils/logger';
import { createSafeMessage } from "../../shared/types/message";

export interface OpenRouterModel extends ModelInfo {
  id: string;
  temperature?: number;
}

/**
 * Crea uno stream per OpenRouter utilizzando il formato OpenAI
 */
export async function createOpenRouterStream(
  client: OpenAI,
  systemPrompt: string,
  messages: ChatMessage[],
  model: OpenRouterModel,
  o3MiniReasoningEffort?: number,
  thinkingBudgetTokens?: number,
  openRouterProviderSorting?: string[]
): Promise<ApiStream<any>> {
  try {
    // Prepara la lista di messaggi
    const allMessages = [
      createSafeMessage({role: 'system', content: systemPrompt, timestamp: Date.now()}) as ChatMessage,
      ...messages,
    ];

    // Converti i messaggi al formato OpenAI utilizzando il transformer
    const openAiMessages = OpenAITransformer.toLLMMessages(allMessages);

    // Opzioni base
    const options: any = {
      model: model.id,
      messages: openAiMessages,
      temperature: model.temperature || 0.2,
      ...(thinkingBudgetTokens ? { max_tokens: thinkingBudgetTokens } : {}),
      ...(o3MiniReasoningEffort ? { reasoning_effort: o3MiniReasoningEffort } : {}),
      stream: true,
    };

    // Gestisci la caching specifica di alcuni provider
    if (isCacheEnabledModel(model.id)) {
      setupCacheControl(options);
    }

    // Configura token massimi per i modelli Claude
    if (isClaudeModel(model.id)) {
      options.max_tokens = 8192;
    }

    // Gestisci parametri specifici per alcuni modelli
    if (isSpecialTemperatureModel(model.id)) {
      options.temperature = 0.7;
      options.top_p = 0.95;
    }

    // Configurazione del reasoning per i modelli che lo supportano
    if (isReasoningEnabledModel(model.id) && thinkingBudgetTokens && thinkingBudgetTokens > 0) {
      options.temperature = undefined; // extended thinking non supporta temperature != 1
      options.reasoning = { max_tokens: thinkingBudgetTokens };
    }

    // Esecuzione della richiesta
    logger.info(`Invio richiesta streaming a OpenRouter con modello: ${model.id}`);

    // @ts-ignore - ignorare errori di tipo sul metodo create
    const rawStream = await client.chat.completions.create(options);

    // Adatta lo stream per implementare l'interfaccia ApiStream
    const stream: ApiStream<any> = {
      ...rawStream,
      [Symbol.asyncIterator]: rawStream[Symbol.asyncIterator].bind(rawStream),
    };

    return stream;
  } catch (error) {
    logger.error(`Errore durante la creazione dello stream OpenRouter: ${error.message}`);
    throw error;
  }
}

/**
 * Verifica se il modello supporta la cache
 */
function isCacheEnabledModel(modelId: string): boolean {
  return modelId.includes('anthropic/claude');
}

/**
 * Verifica se è un modello Claude
 */
function isClaudeModel(modelId: string): boolean {
  return (
    modelId.includes('claude-3.7-sonnet') ||
    modelId.includes('claude-3.5-sonnet') ||
    modelId.includes('claude-3-5-haiku')
  );
}

/**
 * Verifica se è un modello che richiede parametri speciali
 */
function isSpecialTemperatureModel(modelId: string): boolean {
  return (
    modelId.startsWith('deepseek/deepseek-r1') ||
    modelId === 'perplexity/sonar-reasoning' ||
    modelId === 'qwen/qwq-32b:free' ||
    modelId === 'qwen/qwq-32b'
  );
}

/**
 * Verifica se è un modello che supporta il reasoning
 */
function isReasoningEnabledModel(modelId: string): boolean {
  return modelId.includes('claude-3.7-sonnet') || modelId.includes('claude-3-7-sonnet');
}

/**
 * Configura la cache control per i modelli Anthropic
 */
function setupCacheControl(options: any): void {
  if (typeof options.messages[0].content === 'string') {
    options.messages[0] = createSafeMessage({role: 'system', content: [
                            {
                              type: 'text',
                              text: options.messages[0].content,
                              cache_control: { type: 'ephemeral' },
                            },
                          ]});
  }

  // Aggiungi cache_control agli ultimi due messaggi utente
  const userMessages = options.messages.filter((msg: any) => msg.role === 'user').slice(-2);

  userMessages.forEach((msg: any) => {
    if (typeof msg.content === 'string') {
      msg.content = [{ type: 'text', text: msg.content }];
    }

    if (Array.isArray(msg.content)) {
      let lastTextPart = msg.content.filter((part: any) => part.type === 'text').pop();

      if (!lastTextPart) {
        lastTextPart = { type: 'text', text: '...' };
        msg.content.push(lastTextPart);
      }

      lastTextPart.cache_control = { type: 'ephemeral' };
    }
  });
}
