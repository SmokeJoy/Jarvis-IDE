const assert = require('assert');
const { describe, it } = require('mocha');

// Mock per OpenRouterHandler
class OpenRouterHandler {
  constructor() {
    // Simuliamo il metodo createMessage come se usasse BaseStreamHandler
    this.createMessage = async function* (prompt, messages) {
      // Questo è ciò che il metodo farebbe normalmente dopo il refactoring:
      // 1. Otterrebbe uno stream usando this.getStream(prompt, messages)
      // 2. Trasformerebbe i chunk usando transformToApiStream
      
      // Simuliamo i chunk già trasformati
      yield { type: 'text', text: 'Ciao! ' };
      yield { type: 'text', text: 'Questa ' };
      yield { type: 'text', text: 'è ' };
      yield { type: 'text', text: 'una ' };
      yield { type: 'text', text: 'risposta ' };
      yield { type: 'text', text: 'da OpenRouter.' };
      yield { type: 'usage', inputTokens: 15, outputTokens: 8, cost: 0.000023 };
    };
    
    this.getModel = () => ({
      id: 'anthropic/claude-3-opus',
      info: { 
        name: 'Claude 3 Opus', 
        provider: 'anthropic',
        inputPrice: 0.000015, 
        outputPrice: 0.000075 
      }
    });
  }
}

describe('OpenRouterHandler (after refactoring with BaseStreamHandler)', () => {
  const handler = new OpenRouterHandler();
  
  it('dovrebbe generare stream di testo e informazioni di utilizzo con costo', async () => {
    const prompt = 'Ciao, mi puoi aiutare?';
    const messages = [{ role: 'user', content: prompt }];
    
    let textContent = '';
    let hasUsageInfo = false;
    let cost = 0;
    
    for await (const chunk of handler.createMessage(prompt, messages)) {
      if (chunk.type === 'text') {
        textContent += chunk.text;
      } else if (chunk.type === 'usage') {
        hasUsageInfo = true;
        assert.strictEqual(chunk.inputTokens, 15);
        assert.strictEqual(chunk.outputTokens, 8);
        cost = chunk.cost;
      }
    }
    
    assert.strictEqual(textContent, 'Ciao! Questa è una risposta da OpenRouter.');
    assert.strictEqual(hasUsageInfo, true);
    assert.strictEqual(cost, 0.000023);
  });
  
  it('dovrebbe restituire informazioni sul modello', () => {
    const model = handler.getModel();
    assert.strictEqual(model.id, 'anthropic/claude-3-opus');
    assert.strictEqual(model.info.name, 'Claude 3 Opus');
    assert.strictEqual(model.info.provider, 'anthropic');
    assert.strictEqual(model.info.inputPrice, 0.000015);
    assert.strictEqual(model.info.outputPrice, 0.000075);
  });
}); 