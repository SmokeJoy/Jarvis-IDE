/**
 * @file setupMessageMock.ts
 * @description Helper per simulare messaggi dell'estensione nei test
 * @version 1.0.1
 */

import { vi } from 'vitest';
import { act } from '@testing-library/react';
import type { MasMessageUnion } from '../../types/mas-message';
import type { WebviewMessageUnion } from '../../../../src/shared/types/webviewMessageUnion';

type Handler = (event: MessageEvent) => void;
type MessageType = MasMessageUnion | WebviewMessageUnion;

/**
 * Setup per intercettare e simulare messaggi nei test
 * Utile per testare componenti che utilizzano window.addEventListener('message', ...)
 */
export function setupMessageMock() {
  // Array che mantiene tutti gli handler registrati
  const messageHandlers: Handler[] = [];

  // Implementazione del mock per addEventListener
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    .mockImplementation((eventType, handler: EventListenerOrEventListenerObject) => {
      if (eventType === 'message' && typeof handler === 'function') {
        messageHandlers.push(handler);
        console.log('Added message handler, total:', messageHandlers.length);
      }
    });

  // Implementazione del mock per removeEventListener
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    .mockImplementation((eventType, handler: EventListenerOrEventListenerObject) => {
      if (eventType === 'message' && typeof handler === 'function') {
        const index = messageHandlers.indexOf(handler);
        if (index !== -1) {
          messageHandlers.splice(index, 1);
          console.log('Removed message handler, remaining:', messageHandlers.length);
        }
      }
    });

  /**
   * Simula l'arrivo di un messaggio dall'estensione
   * @param data Il payload del messaggio (deve essere un tipo valido di MasMessageUnion o WebviewMessageUnion)
   */
  const simulateMessage = <T extends MessageType>(data: T) => {
    // Verifica che ci siano handler registrati per i messaggi
    if (messageHandlers.length === 0) {
      console.warn('No message handlers registered. Make sure component is mounted and uses addEventListener.');
    }

    // Utilizziamo act() per garantire che React aggiorni lo stato in modo sincrono
    act(() => {
      const msg = new MessageEvent('message', { data });
      messageHandlers.forEach(handler => {
        try {
          handler(msg);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    });
  };

  /**
   * Reset dei mock e pulizia degli handler
   */
  const reset = () => {
    messageHandlers.length = 0;
    addEventListenerSpy.mockClear();
    removeEventListenerSpy.mockClear();
  };

  /**
   * Verifica se ci sono handler registrati
   * @returns true se ci sono handler registrati, false altrimenti
   */
  const hasHandlers = () => messageHandlers.length > 0;

  // Stampa stato iniziale per debug
  console.log('setupMessageMock initialized, handlers:', messageHandlers.length);

  return {
    simulateMessage,
    getHandlers: () => [...messageHandlers], // Restituiamo una copia per sicurezza
    hasHandlers,
    reset,
    // Esponiamo anche l'array diretto per debug
    _handlers: messageHandlers
  };
}

/**
 * Versione "auto-setup" che configura automaticamente il mock nel beforeEach/afterEach
 * @param setupFn Funzione opzionale da eseguire nel beforeEach
 * @param teardownFn Funzione opzionale da eseguire nel afterEach
 */
export function useMessageMock(
  setupFn?: (utils: ReturnType<typeof setupMessageMock>) => void,
  teardownFn?: (utils: ReturnType<typeof setupMessageMock>) => void
) {
  const mockUtils = setupMessageMock();
  
  beforeEach(() => {
    // Assicuriamoci che i mock siano puliti all'inizio di ogni test
    mockUtils.reset();
    if (setupFn) setupFn(mockUtils);
  });
  
  afterEach(() => {
    mockUtils.reset();
    if (teardownFn) teardownFn(mockUtils);
  });
  
  return mockUtils;
}

/**
 * Helper per creare rapidamente un messaggio dell'estensione tipizzato per i test
 * @param messageType Il tipo di messaggio
 * @param payload Il payload del messaggio (opzionale)
 */
export function createTestMessage<T extends MessageType>(
  messageType: T['type'],
  payload?: Omit<T, 'type'>
): T {
  return {
    type: messageType,
    ...payload
  } as T;
} 