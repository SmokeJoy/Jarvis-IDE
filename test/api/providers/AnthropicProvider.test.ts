import { getApiProvider } from '../../../src/agent/api/getApiProvider';
import { StreamHandler } from '../../../src/agent/api/ApiProvider';
import { ChatMessage } from '../../../src/types/ChatMessage';

// Mock della funzione fetch globale
global.fetch = jest.fn().mockImplementation((url, options) => {
  const isStream = JSON.parse(options.body).stream === true;
  
  if (isStream) {
    // Mock di una risposta in streaming
    const mockReadable = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Simula diversi chunk di dati
        const chunks = [
          'data: {"type":"content_block_start","content_block":{"type":"text","text":"Ciao"}}',
          'data: {"type":"content_block_delta","delta":{"type":"text","text":", sono Claude"}}',
          'data: {"type":"content_block_delta","delta":{"type":"text","text":", un assistente AI."}}',
          'data: [DONE]'
        ];
        
        // Aggiungi i chunk al controller
        chunks.forEach(chunk => {
          controller.enqueue(encoder.encode(chunk + '\n'));
        });
        
        controller.close();
      }
    });
    
    return Promise.resolve({
      ok: true,
      body: mockReadable,
      json: () => Promise.resolve({})
    });
  } else {
    // Mock di una risposta standard
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'msg_mock123',
        content: [
          {
            type: 'text',
            text: 'Sono Claude, un assistente AI sviluppato da Anthropic.'
          }
        ],
        role: 'assistant',
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 15
        }
      })
    });
  }
});

describe('AnthropicProvider', () => {
  const provider = getApiProvider('anthropic');

  const mockApiKey = 'sk-test';
  const baseUrl = 'https://api.anthropic.com';

  const messages: ChatMessage[] = [
    { role: 'user', content: 'Ciao, chi sei?', timestamp: new Date().toISOString() }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('chat() restituisce un messaggio valido', async () => {
    const result = await provider.chat(messages, mockApiKey, baseUrl);
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/messages'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'x-api-key': mockApiKey
      })
    }));
    
    expect(result).toHaveProperty('role', 'assistant');
    expect(result.content).toBeDefined();
    
    if (Array.isArray(result.content)) {
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('text');
    }
  });

  test('streamChat() gestisce lo stream correttamente', async () => {
    const tokens: string[] = [];

    const handler: StreamHandler = {
      onToken: (token) => tokens.push(token),
      onError: (err) => {
        throw err;
      },
      onComplete: jest.fn()
    };

    await provider.streamChat(messages, mockApiKey, baseUrl, handler);
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/messages'), expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"stream":true')
    }));
    
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toContain('Claude');
    expect(handler.onComplete).toHaveBeenCalled();
  });
}); 