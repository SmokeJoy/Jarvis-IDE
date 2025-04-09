/**
 * Test suite per l'AnthropicProvider
 * 
 * Testa le funzionalità di:
 * 1. chat() - chiamata standard all'API
 * 2. streamChat() - chiamata streaming
 * 3. AnthropicTransformer - conversione bidirezionale messaggi
 */

import { AnthropicProvider } from '../AnthropicProvider.js.js';
import { AnthropicTransformer } from '../../../../api/transform/anthropic-format.js.js';
import type { ChatMessage } from '../../../../types/chat.types.js.js';
import type { ContentType } from '../../../../types/chat.types.js.js';
import type { StreamHandler } from '../../ApiProvider.js.js';

// Mock globale per fetch
global.fetch = jest.fn();

// Una chiave API fittizia per i test
const MOCK_API_KEY = 'sk-ant-mock1234567890';
const MOCK_BASE_URL = 'https://api.anthropic.com/v1/messages';

// Esempio di messaggio chat per i test
const sampleChatMessage: ChatMessage = {
  role: 'user',
  content: 'Qual è la capitale dell\'Italia?',
  timestamp: new Date().toISOString()
};

// Messaggio con funzioni/tools
const sampleMessageWithTools: ChatMessage = {
  role: 'user',
  content: 'Che tempo fa a Milano?',
  timestamp: new Date().toISOString(),
  functions: [
    {
      name: 'get_weather',
      description: 'Ottiene le previsioni meteo per una località',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'La città e la nazione, es. Milano, Italia'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'L\'unità di temperatura'
          }
        },
        required: ['location']
      }
    }
  ]
};

// Messaggio con immagine base64 troppo grande
const createLargeImageMessage = (): ChatMessage => {
  // Crea una stringa base64 di circa 11MB (eccede il limite di 10MB)
  // Nota: 1 carattere base64 = 6 bit, quindi circa 1.5 milioni di caratteri = ~11MB
  const largeBase64 = 'A'.repeat(1024 * 1024 * 11 / 6);
  
  return {
    role: 'user',
    content: [
      {
        type: ContentType.Text,
        text: 'Analizza questa immagine'
      },
      {
        type: ContentType.Image,
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: largeBase64
        }
      }
    ],
    timestamp: new Date().toISOString()
  };
};

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  
  // Reset dei mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
    provider = new AnthropicProvider();
    
    // Mock del metodo fetch per restituire risposte predefinite
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      // Estrai il corpo della richiesta
      const requestBody = JSON.parse(options.body as string);
      
      if (requestBody.stream) {
        // Simula risposta in streaming
        const mockResponse = new ReadableStream({
          start(controller) {
            // Simula un messaggio iniziale
            controller.enqueue(new TextEncoder().encode(
              'data: {"type":"message_start","message":{"id":"msg_01H9RWP46ZQ6NWPBWZ5G1XB11J","type":"message","role":"assistant","content":[],"model":"claude-3-opus-20240229","stop_reason":null,"usage":{"input_tokens":38,"output_tokens":0}}}\n\n'
            ));
            
            // Simula un blocco di testo
            controller.enqueue(new TextEncoder().encode(
              'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n'
            ));
            
            // Simula una delta di testo
            controller.enqueue(new TextEncoder().encode(
              'data: {"type":"content_block_delta","index":0,"delta":{"type":"text","text":"Roma è la capitale dell\'Italia."}}\n\n'
            ));
            
            // Se ci sono tools nella richiesta, simula anche tool_use
            if (requestBody.tools && requestBody.tools.length > 0) {
              // Simula un tool_use
              controller.enqueue(new TextEncoder().encode(
                'data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"tu_01H9RWPGCHZP41KZB7CQ8NJJA8","name":"get_weather","input":{"location":"Milano"}}}\n\n'
              ));
              
              // E poi un tool_result
              controller.enqueue(new TextEncoder().encode(
                'data: {"type":"content_block_start","index":2,"content_block":{"type":"tool_result","tool_use_id":"tu_01H9RWPGCHZP41KZB7CQ8NJJA8","content":"Oggi a Milano ci sono 22°C con cielo sereno.","is_error":false}}\n\n'
              ));
              
              // Aggiungi anche una delta per un tool_use
              controller.enqueue(new TextEncoder().encode(
                'data: {"type":"content_block_delta","index":3,"delta":{"type":"tool_use","id":"tu_02H9RWPGCHZP41KZB7CQ8NJJA9","name":"get_weather","input":{"location":"Roma"}}}\n\n'
              ));
              
              // E una delta per un tool_result
              controller.enqueue(new TextEncoder().encode(
                'data: {"type":"content_block_delta","index":4,"delta":{"type":"tool_result","tool_use_id":"tu_02H9RWPGCHZP41KZB7CQ8NJJA9","content":"A Roma ci sono 25°C con cielo soleggiato.","is_error":false}}\n\n'
              ));
            }
            
            // Simula la fine del messaggio
            controller.enqueue(new TextEncoder().encode(
              'data: {"type":"message_delta","delta":{"stop_reason":"end_turn","usage":{"output_tokens":67}}}\n\n'
            ));
            
            // Segnala [DONE]
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            
            // Completa lo stream
            controller.close();
          }
        });
        
        return Promise.resolve({
          ok: true,
          body: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': 'text/event-stream',
          }),
          json: () => Promise.reject(new Error('Cannot call json() on a streaming response'))
        });
      } else {
        // Simula risposta standard
        let responseBody = {
          id: 'msg_01H9RWP46ZQ6NWPBWZ5G1XB11J',
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'Roma è la capitale dell\'Italia.'
            }
          ],
          model: 'claude-3-opus-20240229',
          stop_reason: 'end_turn',
          usage: {
            input_tokens: 38,
            output_tokens: 67
          }
        };
        
        // Se ci sono tools nella richiesta, includi anche tool_use e tool_result
        if (requestBody.tools && requestBody.tools.length > 0) {
          responseBody.content.push({
            type: 'tool_use',
            id: 'tu_01H9RWPGCHZP41KZB7CQ8NJJA8',
            name: 'get_weather',
            input: {
              location: 'Milano'
            }
          });
          
          responseBody.content.push({
            type: 'tool_result',
            tool_use_id: 'tu_01H9RWPGCHZP41KZB7CQ8NJJA8',
            content: 'Oggi a Milano ci sono 22°C con cielo sereno.',
            is_error: false
          });
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          json: () => Promise.resolve(responseBody)
        });
      }
    });
  });

  describe('chat()', () => {
    it('dovrebbe restituire una risposta valida', async () => {
      const response = await provider.chat(
        [sampleChatMessage],
        MOCK_API_KEY,
        MOCK_BASE_URL
      );
      
      // Verifica che fetch sia stato chiamato con i parametri corretti
      expect(global.fetch).toHaveBeenCalledWith(
        MOCK_BASE_URL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': MOCK_API_KEY,
            'anthropic-version': '2023-06-01'
          })
        })
      );
      
      // Verifica che la risposta sia formattata correttamente
      expect(response).toHaveProperty('role', 'assistant');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('timestamp');
      expect(response.providerFields).toHaveProperty('model', 'claude-3-opus-20240229');
      expect(response.providerFields).toHaveProperty('stopReason', 'end_turn');
      expect(response.providerFields).toHaveProperty('usage');
    });
    
    it('dovrebbe gestire messaggi con funzioni/tools', async () => {
      const response = await provider.chat(
        [sampleMessageWithTools],
        MOCK_API_KEY,
        MOCK_BASE_URL
      );
      
      // Verifica che fetch sia stato chiamato con i tools nella richiesta
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody).toHaveProperty('tools');
      expect(requestBody.tools[0]).toHaveProperty('name', 'get_weather');
      
      // Verifica che la risposta includa il tool_use
      const content = response.content as any[];
      
      // Trova il contenuto di tipo tool_use
      const toolUseContent = content.find(c => c.type === ContentType.ToolUse);
      expect(toolUseContent).toBeDefined();
      expect(toolUseContent).toHaveProperty('name', 'get_weather');
      expect(toolUseContent).toHaveProperty('input.location', 'Milano');
      
      // Verifica il tool_result
      const toolResultContent = content.find(c => c.type === ContentType.ToolResult);
      expect(toolResultContent).toBeDefined();
      expect(toolResultContent).toHaveProperty('tool_use_id', 'tu_01H9RWPGCHZP41KZB7CQ8NJJA8');
      expect(toolResultContent).toHaveProperty('is_error', false);
    });
    
    it('dovrebbe filtrare le immagini base64 troppo grandi', async () => {
      await provider.chat(
        [createLargeImageMessage()],
        MOCK_API_KEY,
        MOCK_BASE_URL
      );
      
      // Verifica che l'immagine sia stata filtrata nella richiesta
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // La content dovrebbe avere solo la parte testuale
      const contentParts = requestBody.messages[0].content;
      expect(contentParts.length).toBe(1);
      expect(contentParts[0].type).toBe('text');
    });
    
    it('dovrebbe gestire gli errori API correttamente', async () => {
      // Simula un errore nell'API
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('{"error":{"type":"authentication_error","message":"Invalid API key"}}')
      }));
      
      // Verifica che l'errore sia propagato
      await expect(
        provider.chat([sampleChatMessage], MOCK_API_KEY, MOCK_BASE_URL)
      ).rejects.toThrow('Errore API Anthropic');
    });
  });

  describe('streamChat()', () => {
    it('dovrebbe processare correttamente lo streaming', async () => {
      // Mock degli handler per lo streaming
      const mockHandler: StreamHandler = {
        onToken: jest.fn(),
        onToolCall: jest.fn(),
        onToolResult: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };
      
      await provider.streamChat(
        [sampleChatMessage],
        MOCK_API_KEY,
        MOCK_BASE_URL,
        mockHandler
      );
      
      // Verifica che fetch sia stato chiamato con stream: true
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody).toHaveProperty('stream', true);
      
      // Verifica che onToken sia stato chiamato con il testo
      expect(mockHandler.onToken).toHaveBeenCalledWith('Roma è la capitale dell\'Italia.');
      
      // Verifica che onComplete sia stato chiamato alla fine
      expect(mockHandler.onComplete).toHaveBeenCalled();
    });
    
    it('dovrebbe processare tool_use e tool_result durante lo streaming', async () => {
      const mockHandler: StreamHandler = {
        onToken: jest.fn(),
        onToolCall: jest.fn(),
        onToolResult: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };
      
      await provider.streamChat(
        [sampleMessageWithTools],
        MOCK_API_KEY,
        MOCK_BASE_URL,
        mockHandler
      );
      
      // Verifica che onToolCall sia stato chiamato
      expect(mockHandler.onToolCall).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'get_weather',
          arguments: expect.objectContaining({
            location: expect.any(String)
          })
        })
      );
      
      // Verifica che onToolResult sia stato chiamato
      expect(mockHandler.onToolResult).toHaveBeenCalledWith(
        expect.objectContaining({
          tool_use_id: expect.any(String),
          content: expect.any(String),
          is_error: false
        })
      );
      
      // Verifica che onComplete sia stato chiamato alla fine
      expect(mockHandler.onComplete).toHaveBeenCalled();
    });
    
    it('dovrebbe gestire gli errori di stream correttamente', async () => {
      // Simula un errore nello stream
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('{"error":{"type":"rate_limit_error","message":"Rate limit exceeded"}}')
      }));
      
      const mockHandler: StreamHandler = {
        onToken: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };
      
      await provider.streamChat(
        [sampleChatMessage],
        MOCK_API_KEY,
        MOCK_BASE_URL,
        mockHandler
      );
      
      // Verifica che onError sia stato chiamato con l'errore
      expect(mockHandler.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Errore API Anthropic')
        })
      );
    });
    
    it('dovrebbe filtrare le immagini base64 troppo grandi durante lo streaming', async () => {
      const mockHandler: StreamHandler = {
        onToken: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };
      
      await provider.streamChat(
        [createLargeImageMessage()],
        MOCK_API_KEY,
        MOCK_BASE_URL,
        mockHandler
      );
      
      // Verifica che l'immagine sia stata filtrata nella richiesta
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // La content dovrebbe avere solo la parte testuale
      const contentParts = requestBody.messages[0].content;
      expect(contentParts.length).toBe(1);
      expect(contentParts[0].type).toBe('text');
    });
  });

  describe('AnthropicTransformer', () => {
    it('dovrebbe convertire correttamente da ChatMessage a AnthropicMessage', () => {
      const transformer = new AnthropicTransformer();
      
      // Test con stringa semplice
      const result1 = transformer.toLLMMessages([sampleChatMessage]);
      expect(result1[0]).toHaveProperty('role', 'user');
      expect(result1[0].content[0]).toHaveProperty('type', 'text');
      expect(result1[0].content[0]).toHaveProperty('text', 'Qual è la capitale dell\'Italia?');
      
      // Test con array di ContentPart
      const messageWithContentParts: ChatMessage = {
        role: 'user',
        content: [
          {
            type: ContentType.Text,
            text: 'Analizza questa immagine'
          },
          {
            type: ContentType.Image,
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: 'ABC123' // Base64 fittizio
            }
          }
        ],
        timestamp: new Date().toISOString()
      };
      
      const result2 = transformer.toLLMMessages([messageWithContentParts]);
      expect(result2[0].content.length).toBe(2);
      expect(result2[0].content[0]).toHaveProperty('type', 'text');
      expect(result2[0].content[1]).toHaveProperty('type', 'image');
      expect(result2[0].content[1].source).toHaveProperty('type', 'base64');
    });
    
    it('dovrebbe convertire correttamente da AnthropicResponse a ChatMessage', () => {
      const transformer = new AnthropicTransformer();
      
      // Crea una risposta fittizia di Anthropic
      const anthropicResponse = {
        id: 'msg_01H9RWP46ZQ6NWPBWZ5G1XB11J',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Ecco la risposta che cerchi.'
          },
          {
            type: 'tool_use',
            id: 'tu_01H9RWPGCHZP41KZB7CQ8NJJA8',
            name: 'get_weather',
            input: {
              location: 'Milano'
            }
          },
          {
            type: 'tool_result',
            tool_use_id: 'tu_01H9RWPGCHZP41KZB7CQ8NJJA8',
            content: 'Oggi a Milano ci sono 22°C con cielo sereno.',
            is_error: false
          }
        ],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 38,
          output_tokens: 67
        }
      };
      
      const result = transformer.fromLLMResponse(anthropicResponse);
      
      // Verifica il risultato
      expect(result).toHaveProperty('role', 'assistant');
      
      // Verifica i content parts
      const contentParts = result.content as any[];
      expect(contentParts.length).toBe(3);
      
      // Verifica il testo
      expect(contentParts[0]).toHaveProperty('type', ContentType.Text);
      expect(contentParts[0]).toHaveProperty('text', 'Ecco la risposta che cerchi.');
      
      // Verifica il tool_use
      expect(contentParts[1]).toHaveProperty('type', ContentType.ToolUse);
      expect(contentParts[1]).toHaveProperty('name', 'get_weather');
      expect(contentParts[1]).toHaveProperty('input.location', 'Milano');
      
      // Verifica il tool_result
      expect(contentParts[2]).toHaveProperty('type', ContentType.ToolResult);
      expect(contentParts[2]).toHaveProperty('tool_use_id', 'tu_01H9RWPGCHZP41KZB7CQ8NJJA8');
      expect(contentParts[2]).toHaveProperty('content', 'Oggi a Milano ci sono 22°C con cielo sereno.');
      expect(contentParts[2]).toHaveProperty('is_error', false);
      
      // Verifica i providerFields
      expect(result.providerFields).toHaveProperty('id', 'msg_01H9RWP46ZQ6NWPBWZ5G1XB11J');
      expect(result.providerFields).toHaveProperty('model', 'claude-3-opus-20240229');
      expect(result.providerFields).toHaveProperty('stopReason', 'end_turn');
      expect(result.providerFields).toHaveProperty('usage');
      expect(result.providerFields).toHaveProperty('internalReasoning');
    });
    
    it('dovrebbe estrarre correttamente il testo dai chunk di streaming', () => {
      const transformer = new AnthropicTransformer();
      
      // Simula un content_block_delta
      const textChunk = {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text',
          text: 'Questa è una risposta.'
        }
      };
      
      const text = transformer.extractTextFromChunk(textChunk);
      expect(text).toBe('Questa è una risposta.');
      
      // Simula un content_block_start
      const startChunk = {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: 'Questo è l\'inizio.'
        }
      };
      
      const startText = transformer.extractTextFromChunk(startChunk);
      expect(startText).toBe('Questo è l\'inizio.');
      
      // Simula un chunk non testuale
      const nonTextChunk = {
        type: 'content_block_delta',
        index: 1,
        delta: {
          type: 'tool_use',
          id: 'tu_123',
          name: 'calculator',
          input: { a: 1, b: 2 }
        }
      };
      
      const nonText = transformer.extractTextFromChunk(nonTextChunk);
      expect(nonText).toBeUndefined();
    });
  });
}); 