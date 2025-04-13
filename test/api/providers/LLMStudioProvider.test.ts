import { LLMStudioProvider } from '../../../src/agent/api/providers/LLMStudioProvider';
import { ChatMessage } from '../../../src/types/chat.types';
import { createSafeMessage } from "@/shared/types/message-adapter";

// Mock di fetch globale per simulare le risposte di LLM Studio
global.fetch = jest.fn();

describe('LLMStudioProvider', () => {
  let provider: LLMStudioProvider;
  const mockApiKey = 'fake-api-key';  // non usato per LLM Studio
  const mockBaseUrl = 'http://localhost:1234';
  
  // Messaggio di test
  const sampleMessage: ChatMessage = createSafeMessage('user', 'text', { timestamp: new Date().toISOString() });

  beforeEach(() => {
    provider = new LLMStudioProvider();
    jest.clearAllMocks();
  });

  describe('isStreamable', () => {
    it('dovrebbe confermare che lo streaming è supportato', () => {
      expect(provider.isStreamable()).toBe(true);
    });
  });

  describe('chat', () => {
    it('dovrebbe inviare una richiesta al server LLM Studio e restituire un ChatMessage', async () => {
      // Mock della risposta per chat()
      const mockResponse = {
        id: 'chatcmpl-123456',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-coder-6.7b',
        choices: [
          {
            message: createSafeMessage({role: 'assistant', content: 'Ecco una funzione per calcolare il fattoriale in Python:\n\n```python\ndef factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    else:\n        return n * factorial(n-1)\n```\n\nQuesta implementazione usa la ricorsione. In alternativa, puoi anche usare un approccio iterativo:'}),
            finish_reason: 'stop',
            index: 0
          }
        ],
        usage: {
          prompt_tokens: 30,
          completion_tokens: 100,
          total_tokens: 130
        }
      };

      // Setup del mock di fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Chiamata al metodo chat()
      const result = await provider.chat([sampleMessage], mockApiKey, mockBaseUrl);

      // Verifica che fetch sia stato chiamato con i parametri corretti
      expect(global.fetch).toHaveBeenCalledWith(
        mockBaseUrl + '/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );

      // Verifica del body della richiesta
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).toEqual(expect.objectContaining({
        model: 'deepseek-coder-6.7b',
        messages: expect.any(Array),
        temperature: expect.any(Number),
        max_tokens: expect.any(Number)
      }));

      // Verifica della risposta trasformata
      expect(result).toEqual(expect.objectContaining(createSafeMessage({role: 'assistant', content: expect.arrayContaining([
                                                expect.objectContaining({
                                                  type: 'text',
                                                  text: expect.stringContaining('Ecco una funzione per calcolare il fattoriale in Python')
                                                })
                                              ]), timestamp: expect.any(String), providerFields: expect.objectContaining({
                                                model: 'deepseek-coder-6.7b'
                                              })})));
    });

    it('dovrebbe gestire correttamente gli errori di rete', async () => {
      // Mock di una risposta di errore
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Errore interno del server'
      });

      // Verifica che l'errore venga gestito correttamente
      await expect(provider.chat([sampleMessage], mockApiKey, mockBaseUrl))
        .rejects
        .toThrow('Errore LLM Studio: 500 - Errore interno del server');
    });
  });

  describe('streamChat', () => {
    it('dovrebbe processare correttamente lo streaming di risposte', async () => {
      // Preparazione del ReadableStream per simulare lo streaming
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          
          // Simula le risposte in streaming
          const chunks = [
            'data: {"choices":[{"delta":{"role":"assistant"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"Ecco"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":" una"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":" funzione"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":" in"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":" Python"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":":"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\n\n```python"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\ndef factorial(n):"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\n    if n == 0 or n == 1:"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\n        return 1"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\n    else:"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\n        return n * factorial(n-1)"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\n```"},"index":0}]}\n\n',
            'data: [DONE]\n\n'
          ];
          
          // Invia chunks al controller
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      // Prepara il mock del fetch con streaming
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
        status: 200
      });

      // Handler dello streaming
      const mockHandler = {
        onToken: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      // Esegui streamChat
      await provider.streamChat(
        [sampleMessage],
        mockApiKey,
        mockBaseUrl,
        mockHandler
      );

      // Verifica che fetch sia stato chiamato correttamente
      expect(global.fetch).toHaveBeenCalledWith(
        mockBaseUrl + '/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"stream":true')
        })
      );

      // Verifica che i token siano stati ricevuti
      expect(mockHandler.onToken).toHaveBeenCalledTimes(13); // Escludiamo il primo (role:assistant) e l'ultimo (DONE)
      expect(mockHandler.onComplete).toHaveBeenCalledTimes(1);
      expect(mockHandler.onError).not.toHaveBeenCalled();
    });

    it('dovrebbe gestire correttamente le function calls in streaming', async () => {
      // Preparazione del ReadableStream per simulare lo streaming con function call
      const mockStreamWithFunctionCall = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          
          // Simula le risposte in streaming con una function call
          const chunks = [
            'data: {"choices":[{"delta":{"role":"assistant"},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"function_call":{"name":"calculate_factorial"}},"index":0}]}\n\n',
            'data: {"choices":[{"delta":{"function_call":{"arguments":"{\\"n\\": 5}"}},"index":0}]}\n\n',
            'data: [DONE]\n\n'
          ];
          
          // Invia chunks al controller
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      // Prepara il mock del fetch con streaming
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStreamWithFunctionCall,
        status: 200
      });

      // Handler dello streaming
      const mockHandler = {
        onToken: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      // Esegui streamChat
      await provider.streamChat(
        [sampleMessage],
        mockApiKey,
        mockBaseUrl,
        mockHandler,
        undefined,
        {
          functions: [
            {
              name: 'calculate_factorial',
              description: 'Calcola il fattoriale di un numero',
              parameters: {
                type: 'object',
                properties: {
                  n: {
                    type: 'integer',
                    description: 'Il numero di cui calcolare il fattoriale'
                  }
                },
                required: ['n']
              }
            }
          ]
        }
      );

      // Verifica che i token di function call siano stati ricevuti
      expect(mockHandler.onToken).toHaveBeenCalledWith(expect.stringContaining('[FUNCTION_CALL: calculate_factorial('));
      expect(mockHandler.onComplete).toHaveBeenCalledTimes(1);
      expect(mockHandler.onError).not.toHaveBeenCalled();
    });

    it('dovrebbe gestire correttamente gli errori durante lo streaming', async () => {
      // Mock di una risposta di errore
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => 'Bad Gateway'
      });

      // Handler dello streaming
      const mockHandler = {
        onToken: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      // Esegui streamChat e verifica che l'errore sia gestito
      await expect(provider.streamChat(
        [sampleMessage],
        mockApiKey,
        mockBaseUrl,
        mockHandler
      )).rejects.toThrow('Errore LLM Studio: 502 - Bad Gateway');

      // Verifica che onError sia stato chiamato
      expect(mockHandler.onError).toHaveBeenCalledTimes(1);
      expect(mockHandler.onError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockHandler.onComplete).not.toHaveBeenCalled();
    });
  });
}); 