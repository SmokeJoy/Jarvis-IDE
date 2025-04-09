/**
 * @file convertToWebviewMessage.test.ts
 * @description Test unitari per la funzione di conversione convertToWebviewMessage
 */

import type { convertToWebviewMessage, ExtensionMessage, WebviewMessage } from './webview.types.js.js';

describe('convertToWebviewMessage', () => {
  it('should return null for null input', () => {
    expect(convertToWebviewMessage(null as any)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(convertToWebviewMessage(undefined as any)).toBeNull();
  });

  it('should return null for object without type', () => {
    expect(convertToWebviewMessage({} as any)).toBeNull();
  });

  it('should return null for non-object input', () => {
    expect(convertToWebviewMessage('string' as any)).toBeNull();
    expect(convertToWebviewMessage(123 as any)).toBeNull();
    expect(convertToWebviewMessage(true as any)).toBeNull();
  });

  it('should return null if type is not a string', () => {
    expect(convertToWebviewMessage({ type: 123 } as any)).toBeNull();
    expect(convertToWebviewMessage({ type: {} } as any)).toBeNull();
    expect(convertToWebviewMessage({ type: true } as any)).toBeNull();
  });

  it('should convert a valid ExtensionMessage to WebviewMessage', () => {
    const msg: ExtensionMessage = {
      type: 'chat.reply',
      payload: { text: 'Hello' }
    };
    const result = convertToWebviewMessage(msg);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(msg.type);
    expect(result?.payload).toEqual(msg.payload);
  });

  it('should handle message with action field', () => {
    const msg: ExtensionMessage = {
      type: 'action',
      action: 'chatButtonClicked'
    };
    const result = convertToWebviewMessage(msg);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(msg.type);
    expect(result?.action).toBe(msg.action);
  });

  it('should handle message with error field', () => {
    const msg: ExtensionMessage = {
      type: 'error',
      error: 'Something went wrong'
    };
    const result = convertToWebviewMessage(msg);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(msg.type);
    expect(result?.payload?.error).toBe(msg.error);
  });

  it('should handle message with apiConfiguration field', () => {
    const apiConfig = { 
      provider: 'openai',
      apiKey: 'test-key',
      modelId: 'gpt-3.5-turbo'
    };
    const msg = {
      type: 'api.configuration',
      apiConfiguration: apiConfig
    } as ExtensionMessage;
    const result = convertToWebviewMessage(msg);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(msg.type);
    expect(result?.apiConfiguration).toEqual(apiConfig);
  });

  it('should handle message with state containing apiConfiguration', () => {
    const apiConfig = { 
      provider: 'openai',
      apiKey: 'test-key',
      modelId: 'gpt-3.5-turbo'
    };
    const msg: ExtensionMessage = {
      type: 'state',
      state: {
        apiConfiguration: apiConfig,
        use_docs: true,
        contextPrompt: '',
        coder_mode: false
      }
    };
    const result = convertToWebviewMessage(msg);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(msg.type);
    expect(result?.apiConfiguration).toEqual(apiConfig);
  });

  it('should handle message with null payload', () => {
    const msg: ExtensionMessage = {
      type: 'response',
      payload: null as any
    };
    const result = convertToWebviewMessage(msg);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(msg.type);
    expect(result?.payload).toEqual({});
  });
}); 