import { Logger } from '../utils/logger.js';
import { AgentResponse } from './JarvisAgent.js';
import type { Settings } from '../shared/settings.js';
import { getApiProvider } from './api/getApiProvider.js';
import { StreamHandler } from './api/ApiProvider.js';
import { ChatMessage, normalizeChatMessages } from '../types/ChatMessage.js';

/**
 * Invia un prompt al modello LLM e gestisce la risposta
 * @param prompt Il prompt da inviare al modello
 * @param settings Le impostazioni dell'applicazione
 * @returns La risposta del modello, interpretata come un'azione
 */
export async function sendPromptToLLM(prompt: string, settings: Settings): Promise<AgentResponse> {
  try {
    Logger.info('Invio prompt al modello LLM');
    
    // Prepara i messaggi per la chat
    const messages: ChatMessage[] = [];
    
    // Aggiungi istruzioni di sistema se disponibili
    if (settings.customInstructions) {
      messages.push({ 
        role: 'system', 
        content: settings.customInstructions,
        timestamp: Date.now()
      });
    }
    
    // Aggiungi il prompt dell'utente
    messages.push({ 
      role: 'user', 
      content: prompt,
      timestamp: Date.now()
    });
    
    // Ottieni il provider appropriato
    const providerId = settings.provider || 'openai';
    Logger.info(`Utilizzo provider: ${providerId}, modello: ${settings.model}`);
    
    try {
      const provider = getApiProvider(providerId);
      const apiKey = settings.apiConfiguration?.apiKey || '';
      const endpoint = settings.apiConfiguration?.baseUrl || '';
      
      let fullResponse = '';
      
      // Utilizza streamChat o chat in base alla capacità del provider
      if (provider.isStreamable()) {
        const streamHandler: StreamHandler = {
          onToken: (token) => {
            // Qui puoi implementare la gestione dello streaming token per token
            // per ora accumuliamo la risposta
            fullResponse += token;
          },
          onError: (error) => {
            Logger.error(`Errore durante lo streaming: ${error.message}`);
          }
        };
        
        fullResponse = await provider.streamChat(messages, apiKey, endpoint, streamHandler);
      } else {
        fullResponse = await provider.chat(messages, apiKey, endpoint);
      }
      
      // Estrai il JSON dalla risposta
      return extractJsonResponse(fullResponse) || {
        action: 'message',
        message: fullResponse
      };
    } catch (error) {
      throw new Error(`Errore con il provider ${providerId}: ${error.message}`);
    }
  } catch (error) {
    Logger.error(`Errore nell'invio del prompt al LLM: ${error.message}`);
    return {
      action: 'message',
      message: `Si è verificato un errore nella comunicazione con il modello LLM: ${error.message}`
    };
  }
}

/**
 * Estrai un oggetto JSON da una risposta testuale
 * @param text Testo della risposta
 * @returns Oggetto AgentResponse estratto o null se non trovato
 */
function extractJsonResponse(text: string): AgentResponse | null {
  try {
    // Cerca un JSON in formato Markdown ```json ... ```
    const jsonMatch = text.match(/```json\s*([\s\S]+?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr) as AgentResponse;
    }
    
    // Cerca un JSON senza il formato Markdown
    const jsonRegex = /\{[\s\S]*?"action"[\s\S]*?\}/g;
    const matches = text.match(jsonRegex);
    
    if (matches && matches.length > 0) {
      for (const match of matches) {
        try {
          const result = JSON.parse(match) as AgentResponse;
          // Verifica che sia un JSON valido con action
          if (result && result.action) {
            return result;
          }
        } catch (e) {
          // Ignora i match che non sono JSON validi
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    Logger.error(`Errore nell'estrazione del JSON dalla risposta: ${error}`);
    return null;
  }
} 