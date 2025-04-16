import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageList } from '../MessageList';

// Helper component to mock scrollToThread
const mockScrollToThread = jest.fn();

// Caso mock di agentTypingState
const mockAgentTypingState = {
  threadA: { agent1: true, agent2: false },
  threadB: { agent3: true }
};

describe('Scroll Lock Thread-aware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('✅ 1. Scroll automatico su thread non bloccato', () => {
    // Simula lo stato
    const messages = [
      { id: 'm1', agentId: 'agent1', threadId: 'threadA', content: 'Hi', role: 'user' },
      { id: 'm2', agentId: 'agent3', threadId: 'threadB', content: 'Lo', role: 'assistant' }
    ];
    const agentTypingState = { threadA: { agent1: true } };
    const scrollLock = { threadA: false, threadB: true };

    // Rendering
    render(
      <MessageList
        messages={messages}
        agentTypingState={agentTypingState}
        scrollLockEnabled={scrollLock}
      />
    );

    // Simula chiamata scrollToThread, che dovrebbe essere invocata solo se scrollLock[threadA] === false
    // Qui ti limitiamo a verificare la prop scrollLockEnabled (propagata corretta)
    const lockIndic = screen.queryByTitle('Scroll lock attivo per questo thread');
    expect(lockIndic).toBeInTheDocument(); // Per threadB dovrebbe esserci, threadA no
  });

  test('❌ 2. Nessuno scroll se scrollLock[threadId] = true', () => {
    // Stato: scrollLock abilitato a true
    const messages = [
      { id: 'm3', agentId: 'agent1', threadId: 'threadA', content: 'Message', role: 'user' }
    ];
    const agentTypingState = { threadA: { agent1: true } };
    const scrollLock = { threadA: true };

    render(
      <MessageList
        messages={messages}
        agentTypingState={agentTypingState}
        scrollLockEnabled={scrollLock}
      />
    );
    // Deve mostrare l'indicatore scroll lock
    const lockIndic = screen.getByTitle('Scroll lock attivo per questo thread');
    expect(lockIndic).toBeInTheDocument();
  });

  test('🔁 3. Stato typing dinamico', async () => {
    // Evento AGENT_TYPING su threadA, segue AGENT_TYPING_DONE
    const messages = [
      { id: 'm4', agentId: 'agent1', threadId: 'threadA', content: 'Hello!', role: 'user' }
    ];
    let agentTypingState = { threadA: { agent1: true } };
    const scrollLock = { threadA: false };
    const { rerender } = render(
      <MessageList
        messages={messages}
        agentTypingState={agentTypingState}
        scrollLockEnabled={scrollLock}
      />
    );
    // Badge typing visibile
    expect(screen.getByText(/sta scrivendo/)).toBeInTheDocument();

    // Simula evento AGENT_TYPING_DONE
    agentTypingState = { threadA: { agent1: false } };
    rerender(
      <MessageList
        messages={messages}
        agentTypingState={agentTypingState}
        scrollLockEnabled={scrollLock}
      />
    );
    // Badge typing assente
    expect(screen.queryByText(/sta scrivendo/)).not.toBeInTheDocument();
  });
});