import { vi } from 'vitest';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { webviewBridge } from '../utils/WebviewBridge';
import { WebviewMessageType, ExtensionMessage } from '../../../src/shared/types/webview.types';
import { mockVSCodeAPI, simulateExtensionMessage, getLastSentMessage, resetIntegrationMocks } from './integration-helpers';

describe('WebView ↔ Extension Integration Roundtrip', () => {
  beforeEach(() => {
    mockVSCodeAPI();
    resetIntegrationMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test base di roundtrip: invio di un messaggio dalla WebView
   * e ricezione di una risposta simulata dall'Extension
   */
  test('dovrebbe completare un ciclo roundtrip base', () => {
    return new Promise<void>((done) => {
      // Preparazione messaggio di richiesta dalla WebView
      const promptPayload = { prompt: 'Ciao, come stai?' };
      
      // Preparazione risposta simulata dall'Extension
      const responsePayload: ExtensionMessage = {
        type: 'response',
        message: 'Sto bene, grazie per averlo chiesto!'
      };

      // Registra listener per la risposta
      const responseHandler = vi.fn((response) => {
        // Verifiche sulla risposta ricevuta
        expect(response).toEqual(responsePayload);
        expect(responseHandler).toHaveBeenCalledTimes(1);
        
        // Test completato con successo
        done();
      });

      // Aggancia il listener al bridge
      webviewBridge.on('response', responseHandler);

      // Invia il messaggio dalla WebView all'Extension
      webviewBridge.sendMessage({
        type: WebviewMessageType.SEND_PROMPT,
        payload: promptPayload
      });

      // Verifica che il messaggio sia stato inviato correttamente
      const sentMessage = getLastSentMessage();
      expect(sentMessage).toEqual({
        type: WebviewMessageType.SEND_PROMPT,
        payload: promptPayload
      });

      // Simula la risposta dall'Extension (dopo un breve ritardo per simulare asincronicità)
      setTimeout(() => {
        simulateExtensionMessage(responsePayload);
      }, 50);
    });
  });

  /**
   * Test di robustezza: gestione di un messaggio malformato dall'Extension
   */
  test('dovrebbe gestire correttamente messaggi malformati', () => {
    const invalidMessage = {
      data: 'messaggio non valido senza type'
    };

    // Registra listener
    const responseHandler = vi.fn();
    webviewBridge.on('response', responseHandler);

    // Simula ricezione messaggio malformato
    simulateExtensionMessage(invalidMessage);

    // Verifica: il listener non deve essere chiamato, deve esserci un warning
    expect(responseHandler).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  /**
   * Test con multipli messaggi in sequenza
   */
  test('dovrebbe gestire correttamente multipli messaggi', () => {
    return new Promise<void>((done) => {
      const messages = [
        { type: 'init', status: 'success' },
        { type: 'response', message: 'Primo messaggio' },
        { type: 'response', message: 'Secondo messaggio' }
      ];

      let messageCount = 0;
      
      // Registra listener per il tipo 'response'
      const responseHandler = vi.fn((response) => {
        messageCount++;
        
        // Verifica che i messaggi siano ricevuti in ordine
        if (messageCount === 1) {
          expect(response.message).toBe('Primo messaggio');
        } else if (messageCount === 2) {
          expect(response.message).toBe('Secondo messaggio');
          done();
        }
      });

      // Aggancia il listener
      webviewBridge.on('response', responseHandler);

      // Simula ricezione multipli messaggi in sequenza
      messages.forEach((msg, index) => {
        setTimeout(() => {
          simulateExtensionMessage(msg);
        }, 30 * index);
      });
    });
  });

  /**
   * Test di pulizia listener
   */
  test('dovrebbe rimuovere correttamente i listener', () => {
    const responseHandler = vi.fn();
    
    // Registra e poi rimuovi il listener
    const removeListener = webviewBridge.on('response', responseHandler);
    removeListener();
    
    // Simula un messaggio - il listener non dovrebbe essere chiamato
    simulateExtensionMessage({ type: 'response', message: 'test' });
    expect(responseHandler).not.toHaveBeenCalled();
  });
}); 