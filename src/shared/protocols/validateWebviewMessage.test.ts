/**
 * @file validateWebviewMessage.test.ts
 * @description Test unitari per la validazione dei messaggi WebView
 */

import type { 
  WebviewMessage, 
  BaseWebviewMessage, 
  IncomingWebviewMessage, 
  OutgoingWebviewMessage 
} from './webview.protocol.js';

/**
 * Funzione per validare un messaggio WebView
 */
function validateWebviewMessage(message: unknown): message is WebviewMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  const msg = message as Record<string, unknown>;
  
  // Verifica che il tipo sia una stringa non vuota
  if (typeof msg.type !== 'string' || msg.type.trim() === '') {
    return false;
  }
  
  // Verifica che il payload sia un oggetto se presente
  if (msg.payload !== undefined && typeof msg.payload !== 'object') {
    return false;
  }
  
  // Verifica che source sia "extension" o "webview" se presente
  if (msg.source !== undefined && 
      msg.source !== 'extension' && 
      msg.source !== 'webview') {
    return false;
  }
  
  // Verifica che requestId sia una stringa se presente
  if (msg.requestId !== undefined && typeof msg.requestId !== 'string') {
    return false;
  }
  
  // Verifica che error sia una stringa se presente
  if (msg.error !== undefined && typeof msg.error !== 'string') {
    return false;
  }
  
  return true;
}

describe('validateWebviewMessage', () => {
  it('should reject null or undefined input', () => {
    expect(validateWebviewMessage(null)).toBe(false);
    expect(validateWebviewMessage(undefined)).toBe(false);
  });
  
  it('should reject non-object input', () => {
    expect(validateWebviewMessage('string')).toBe(false);
    expect(validateWebviewMessage(123)).toBe(false);
    expect(validateWebviewMessage(true)).toBe(false);
  });
  
  it('should reject objects without type', () => {
    expect(validateWebviewMessage({})).toBe(false);
    expect(validateWebviewMessage({ payload: {} })).toBe(false);
  });
  
  it('should reject objects with non-string type', () => {
    expect(validateWebviewMessage({ type: 123 })).toBe(false);
    expect(validateWebviewMessage({ type: {} })).toBe(false);
    expect(validateWebviewMessage({ type: true })).toBe(false);
  });
  
  it('should reject objects with empty type', () => {
    expect(validateWebviewMessage({ type: '' })).toBe(false);
    expect(validateWebviewMessage({ type: '   ' })).toBe(false);
  });
  
  it('should reject objects with invalid source', () => {
    expect(validateWebviewMessage({ type: 'test', source: 'invalid' })).toBe(false);
    expect(validateWebviewMessage({ type: 'test', source: 123 })).toBe(false);
  });
  
  it('should accept a valid BaseWebviewMessage', () => {
    const message: BaseWebviewMessage<'agent.run', { agentId: string; task: string }> = {
      type: 'agent.run',
      payload: { agentId: 'dev-agent', task: 'write code' }
    };
    expect(validateWebviewMessage(message)).toBe(true);
  });
  
  it('should accept a valid IncomingWebviewMessage', () => {
    const message: IncomingWebviewMessage = {
      type: 'agent.run',
      payload: { agentId: 'dev-agent', task: 'write code' },
      source: 'webview',
      requestId: '123'
    };
    expect(validateWebviewMessage(message)).toBe(true);
  });
  
  it('should accept a valid OutgoingWebviewMessage', () => {
    const message: OutgoingWebviewMessage = {
      type: 'agent.state',
      payload: { agents: [{ id: 'dev-agent', status: 'idle' }] },
      source: 'extension'
    };
    expect(validateWebviewMessage(message)).toBe(true);
  });
  
  it('should handle optional properties correctly', () => {
    const message: WebviewMessage = {
      type: 'notification',
      payload: { level: 'info', message: 'Test notification' },
      requestId: '123',
      source: 'extension',
      error: 'Some error occurred'
    };
    expect(validateWebviewMessage(message)).toBe(true);
  });
});

// Funzione di esportazione per utilizzo nell'applicazione
export { validateWebviewMessage }; 