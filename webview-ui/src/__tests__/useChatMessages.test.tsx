import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react'; from '@testing-library/react'; from '@testing-library/react'; from '@testing-library/react'; from '@testing-library/react'; from '@testing-library/react';
import { ChatMessage } from '../../../src/shared/types/webview.types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useChatMessages } from '../hooks/useChatMessages';
import { ChatMessage as ChatMessageType, MessageRole } from '../types/chat';

// Importa direttamente la funzione useChatMessages per il test
// Nota: in un caso reale potremmo estrarre useChatMessages in un file separato
// Per questo test, lo ricreiamo qui basato sull'implementazione in ChatView.tsx
import { useState, useCallback, useRef } from 'react';

// Ricreazione della funzione isChatMessage per il test
function isChatMessage(obj: any): obj is ChatMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.role === 'string' &&
    (typeof obj.content === 'string' || Array.isArray(obj.content))
  );
}

// Ricreazione della funzione isChatMessageArray per il test
function isChatMessageArray(arr: any[]): arr is ChatMessage[] {
  return Array.isArray(arr) && arr.every(isChatMessage);
}

// Implementazione del hook per il test
function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  
  const updateMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    messagesRef.current = newMessages;
  }, []);
  
  const addMessage = useCallback((message: ChatMessage) => {
    if (isChatMessage(message)) {
      updateMessages([...messagesRef.current, message]);
    } else {
      console.warn('Tentativo di aggiungere un messaggio non valido:', message);
    }
  }, [updateMessages]);
  
  const addMessages = useCallback((newMessages: ChatMessage[]) => {
    if (Array.isArray(newMessages) && isChatMessageArray(newMessages)) {
      updateMessages([...messagesRef.current, ...newMessages]);
    } else {
      console.warn('Tentativo di aggiungere messaggi non validi:', newMessages);
    }
  }, [updateMessages]);
  
  const loadMessages = useCallback((newMessages: ChatMessage[]) => {
    if (Array.isArray(newMessages) && isChatMessageArray(newMessages)) {
      updateMessages(newMessages);
    } else {
      console.warn('Tentativo di caricare messaggi non validi:', newMessages);
    }
  }, [updateMessages]);
  
  const clearMessages = useCallback(() => {
    updateMessages([]);
  }, [updateMessages]);
  
  return {
    messages,
    addMessage,
    addMessages,
    loadMessages,
    clearMessages
  };
}

// Messaggi validi di esempio per i test
const validUserMessage: ChatMessage = {
  role: 'user',
  content: 'Ciao, come stai?',
  timestamp: Date.now()
};

const validAssistantMessage: ChatMessage = {
  role: 'assistant',
  content: 'Sto bene, grazie! Come posso aiutarti?',
  timestamp: Date.now() + 1000
};

// Messaggio non valido per i test negativi
const invalidMessage = {
  content: 'Messaggio senza role',
  timestamp: Date.now()
};

// Funzioni helper per i test
const createValidMessage = (id: string = 'msg1'): ChatMessage => ({
  id,
  role: 'user' as MessageRole,
  content: 'Test message',
  timestamp: Date.now()
});

const createInvalidMessage = (): any => ({
  // Manca id e altri campi obbligatori
  role: 'unknown', // Valore non valido
  content: 'Invalid message'
});

describe('useChatMessages hook', () => {
  // Mock per console.warn
  let consoleWarnSpy: any;
  
  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });
  
  it('dovrebbe inizializzare con un array di messaggi vuoto', () => {
    const { result } = renderHook(() => useChatMessages());
    expect(result.current.messages).toEqual([]);
  });
  
  it('dovrebbe aggiungere un messaggio valido', () => {
    const { result } = renderHook(() => useChatMessages());
    const message = createValidMessage();
    
    act(() => {
      result.current.addMessage(message);
    });
    
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toEqual(message);
  });
  
  it('dovrebbe rifiutare un messaggio non valido', () => {
    const { result } = renderHook(() => useChatMessages());
    const invalidMessage = createInvalidMessage();
    
    act(() => {
      result.current.addMessage(invalidMessage);
    });
    
    // Nessun messaggio dovrebbe essere aggiunto
    expect(result.current.messages.length).toBe(0);
    // Il warning dovrebbe essere chiamato
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('dovrebbe aggiungere multipli messaggi validi', () => {
    const { result } = renderHook(() => useChatMessages());
    const message1 = createValidMessage('msg1');
    const message2 = createValidMessage('msg2');
    
    act(() => {
      result.current.addMessages([message1, message2]);
    });
    
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages).toEqual([message1, message2]);
  });
  
  it('dovrebbe rifiutare array contenente messaggi non validi', () => {
    const { result } = renderHook(() => useChatMessages());
    const validMessage = createValidMessage();
    const invalidMessage = createInvalidMessage();
    
    act(() => {
      result.current.addMessages([validMessage, invalidMessage]);
    });
    
    // Nessun messaggio dovrebbe essere aggiunto (tutto o niente)
    expect(result.current.messages.length).toBe(0);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('dovrebbe caricare una nuova lista di messaggi', () => {
    const { result } = renderHook(() => useChatMessages());
    const messages = [
      createValidMessage('msg1'),
      createValidMessage('msg2'),
      createValidMessage('msg3')
    ];
    
    act(() => {
      result.current.loadMessages(messages);
    });
    
    expect(result.current.messages.length).toBe(3);
    expect(result.current.messages).toEqual(messages);
  });
  
  it('dovrebbe rifiutare di caricare messaggi non validi', () => {
    const { result } = renderHook(() => useChatMessages());
    const initialMessage = createValidMessage('initial');
    
    // Aggiungi messaggio iniziale
    act(() => {
      result.current.addMessage(initialMessage);
    });
    
    // Prova a caricare una lista con messaggi non validi
    const invalidMessages = [
      createValidMessage('valid'),
      createInvalidMessage() // Non valido
    ];
    
    act(() => {
      result.current.loadMessages(invalidMessages);
    });
    
    // Messaggi esistenti non dovrebbero cambiare
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toEqual(initialMessage);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('dovrebbe cancellare tutti i messaggi', () => {
    const { result } = renderHook(() => useChatMessages());
    
    // Aggiungi alcuni messaggi
    act(() => {
      result.current.addMessages([
        createValidMessage('msg1'),
        createValidMessage('msg2')
      ]);
    });
    
    // Verifica che siano stati aggiunti
    expect(result.current.messages.length).toBe(2);
    
    // Pulisci i messaggi
    act(() => {
      result.current.clearMessages();
    });
    
    // Verifica che siano stati eliminati
    expect(result.current.messages.length).toBe(0);
  });
  
  it('dovrebbe gestire correttamente le modifiche asincrone', async () => {
    const { result } = renderHook(() => useChatMessages());
    
    // Aggiungi un messaggio
    await act(async () => {
      result.current.addMessage(createValidMessage('msg1'));
      
      // Aggiungi un'altro messaggio dopo un piccolo ritardo
      await new Promise(resolve => setTimeout(resolve, 10));
      result.current.addMessage(createValidMessage('msg2'));
    });
    
    // Verifica che entrambi i messaggi siano stati aggiunti
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].id).toBe('msg1');
    expect(result.current.messages[1].id).toBe('msg2');
  });
  
  it('dovrebbe mantenere l\'ordine corretto dei messaggi', () => {
    const { result } = renderHook(() => useChatMessages());
    const message1 = { ...createValidMessage('msg1'), timestamp: 1000 };
    const message2 = { ...createValidMessage('msg2'), timestamp: 2000 };
    const message3 = { ...createValidMessage('msg3'), timestamp: 3000 };
    
    // Aggiungi messaggi in ordine non cronologico
    act(() => {
      result.current.addMessage(message2); // Secondo per timestamp
      result.current.addMessage(message1); // Primo per timestamp
      result.current.addMessage(message3); // Terzo per timestamp
    });
    
    // Verifica che i messaggi siano ordinati per timestamp
    expect(result.current.messages.length).toBe(3);
    expect(result.current.messages[0]).toEqual(message1);
    expect(result.current.messages[1]).toEqual(message2);
    expect(result.current.messages[2]).toEqual(message3);
  });
}); 

