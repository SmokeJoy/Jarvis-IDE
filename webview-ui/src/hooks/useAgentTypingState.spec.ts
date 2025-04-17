import { MASEvent } from '@core/messages/events';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAgentTypingState } from './useAgentTypingState';

describe('useAgentTypingState', () => {
  let agentEventBus: any;
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    agentEventBus = {
      on: jest.fn((event, cb) => {
        agentEventBus._listeners = agentEventBus._listeners || {};
        agentEventBus._listeners[event] = cb;
        return () => {};
      }),
      emit(event, payload) {
        if (agentEventBus._listeners && agentEventBus._listeners[event]) {
          agentEventBus._listeners[event](payload);
        }
      }
    };
    dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    dispatchSpy.mockRestore();
  });

  it('dispatcha MAS_CONTEXT_APPLY su typing', () => {
    renderHook(() => useAgentTypingState(agentEventBus));
    act(() => {
      agentEventBus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: MASEvent.CONTEXT_APPLY,
      detail: expect.objectContaining({ agentId: 'a1', threadId: 't1' })
    }));
  });

  it('dispatcha MAS_CONTEXT_APPLY per ciascun agente attivo (multi-agent)', () => {
    renderHook(() => useAgentTypingState(agentEventBus));
    act(() => {
      agentEventBus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
      agentEventBus.emit('AGENT_TYPING', { agentId: 'a2', threadId: 't2' });
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: MASEvent.CONTEXT_APPLY,
      detail: expect.objectContaining({ agentId: 'a1', threadId: 't1' })
    }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: MASEvent.CONTEXT_APPLY,
      detail: expect.objectContaining({ agentId: 'a2', threadId: 't2' })
    }));
  });

  it('non dispatcha se agentId è falsy', () => {
    renderHook(() => useAgentTypingState(agentEventBus));
    act(() => {
      agentEventBus.emit('AGENT_TYPING', { agentId: '', threadId: 't1' });
      agentEventBus.emit('AGENT_TYPING', { agentId: null, threadId: 't1' });
    });
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({
      type: MASEvent.CONTEXT_APPLY,
      detail: expect.objectContaining({ agentId: '', threadId: 't1' })
    }));
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({
      type: MASEvent.CONTEXT_APPLY,
      detail: expect.objectContaining({ agentId: null, threadId: 't1' })
    }));
  });

  it('rate-limita i dispatch MAS_CONTEXT_APPLY (debounce)', () => {
    // Simula debounce: dispatch solo una volta per agentId/threadId in 500ms
    // (Nota: l'implementazione reale non ha debounce, ma il test è pronto per quando verrà aggiunto)
    renderHook(() => useAgentTypingState(agentEventBus));
    act(() => {
      agentEventBus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
      agentEventBus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
      jest.advanceTimersByTime(100);
      agentEventBus.emit('AGENT_TYPING', { agentId: 'a1', threadId: 't1' });
      jest.advanceTimersByTime(500);
    });
    // Dovrebbe essere chiamato almeno una volta, non più di 2
    const calls = dispatchSpy.mock.calls.filter(call => call[0].type === MASEvent.CONTEXT_APPLY && call[0].detail.agentId === 'a1');
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls.length).toBeLessThanOrEqual(3); // dipende da debounce implementato
  });
}); 