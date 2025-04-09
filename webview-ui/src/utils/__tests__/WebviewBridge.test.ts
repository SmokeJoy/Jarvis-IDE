import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webviewBridge } from '../WebviewBridge';
import type { ExtensionMessage } from '../../../../src/shared/ExtensionMessage';

describe('WebviewBridge', () => {
  let postMessageSpy: vi.SpyInstance;

  beforeEach(() => {
    // Mock globale per acquireVsCodeApi
    global.acquireVsCodeApi = vi.fn(() => ({
      postMessage: vi.fn(),
      getState: vi.fn(),
      setState: vi.fn()
    }));

    // Reinizializza il singleton
    vi.resetModules();
    postMessageSpy = vi.spyOn(webviewBridge['vscode'], 'postMessage');
  });

  it('dovrebbe inviare un messaggio valido tramite postMessage', () => {
    const message = { type: 'getSettings' } as ExtensionMessage;
    webviewBridge.sendMessage(message);
    expect(postMessageSpy).toHaveBeenCalledWith(message);
  });

  it('dovrebbe gestire un messaggio valido e invocare il callback', () => {
    const mockCallback = vi.fn();
    const msg: ExtensionMessage = { type: 'settings', payload: { apiKey: 'xxx' } };

    const unsubscribe = webviewBridge.on('settings', mockCallback);

    window.postMessage(msg, '*');
    window.dispatchEvent(new MessageEvent('message', { data: msg }));

    expect(mockCallback).toHaveBeenCalledWith(msg);

    unsubscribe();
  });

  it('non dovrebbe chiamare callback con messaggio non valido', () => {
    const callback = vi.fn();
    webviewBridge.on('response', callback);

    const invalidMsg = { foo: 'bar' };
    window.dispatchEvent(new MessageEvent('message', { data: invalidMsg }));

    expect(callback).not.toHaveBeenCalled();
  });

  it('dovrebbe pulire i listener con dispose', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    webviewBridge.dispose();
    expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
  });
}); 