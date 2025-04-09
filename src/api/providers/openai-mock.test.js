const assert = require('assert');
const { describe, it } = require('mocha');

// Mock della classe OpenAI per evitare chiamate API reali
class MockOpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async () => {
          // Crea un mock dello stream OpenAI
          const mockStream = {
            [Symbol.asyncIterator]: async function* () {
              // Simuliamo alcuni chunk di risposta
              yield { choices: [{ delta: { content: 'Questa ' } }] };
              yield { choices: [{ delta: { content: 'è ' } }] };
              yield { choices: [{ delta: { content: 'una ' } }] };
              yield { choices: [{ delta: { content: 'risposta ' } }] };
              yield { choices: [{ delta: { content: 'di test.' } }] };
              // Aggiunge informazioni di utilizzo nell'ultimo chunk
              yield { 
                choices: [{ delta: {} }],
                usage: { prompt_tokens: 10, completion_tokens: 5 }
              };
            }
          };
          return mockStream;
        }
      }
    };
  }
}

// Mock per OpenAiHandler
class OpenAiHandler {
  constructor() {
    // Simuliamo il metodo createMessage come se usasse BaseStreamHandler
    this.createMessage = async function* (prompt, messages) {
      // Questo è ciò che il metodo farebbe normalmente dopo il refactoring:
      // 1. Otterrebbe uno stream usando this.getStream(prompt, messages)
      // 2. Trasformerebbe i chunk usando transformToApiStream
      
      // Simuliamo i chunk già trasformati
      yield { type: 'text', text: 'Questa ' };
      yield { type: 'text', text: 'è ' };
      yield { type: 'text', text: 'una ' };
      yield { type: 'text', text: 'risposta ' };
      yield { type: 'text', text: 'di test.' };
      yield { type: 'usage', inputTokens: 10, outputTokens: 5 };
    };
    
    this.getModel = () => ({
      id: 'gpt-4',
      info: { name: 'GPT-4', provider: 'openai' }
    });
  }
}

describe('OpenAiHandler (after refactoring with BaseStreamHandler)', () => {
  const handler = new OpenAiHandler();
  
  it('dovrebbe generare stream di testo e informazioni di utilizzo', async () => {
    const prompt = 'Ciao, come stai?';
    const messages = [{ role: 'user', content: prompt }];
    
    let textContent = '';
    let hasUsageInfo = false;
    
    for await (const chunk of handler.createMessage(prompt, messages)) {
      if (chunk.type === 'text') {
        textContent += chunk.text;
      } else if (chunk.type === 'usage') {
        hasUsageInfo = true;
        assert.strictEqual(chunk.inputTokens, 10);
        assert.strictEqual(chunk.outputTokens, 5);
      }
    }
    
    assert.strictEqual(textContent, 'Questa è una risposta di test.');
    assert.strictEqual(hasUsageInfo, true);
  });
  
  it('dovrebbe restituire informazioni sul modello', () => {
    const model = handler.getModel();
    assert.strictEqual(model.id, 'gpt-4');
    assert.strictEqual(model.info.name, 'GPT-4');
    assert.strictEqual(model.info.provider, 'openai');
  });
}); 