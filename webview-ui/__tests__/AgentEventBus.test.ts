import { vi } from 'vitest';
import { describe, it, expect, vi } from 'vitest';
import { AgentEventBus } from '@/core/AgentEventBus';
import {
  MasMessageType,
  AgentMemoryResponseMessage,
  InstructionCompletedMessage,
  InstructionFailedMessage,
} from '@shared/types/mas-message';

describe('AgentEventBus', () => {
  const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    consoleInfo.mockReset();
    consoleWarn.mockReset();
    AgentEventBus.reset();
  });

  afterAll(() => {
    consoleInfo.mockRestore();
    consoleWarn.mockRestore();
  });

  it('chiama handler per AgentMemoryResponseMessage', () => {
    const handler = vi.fn();
    AgentEventBus.on(MasMessageType.AGENT_MEMORY_RESPONSE, handler);

    const message: AgentMemoryResponseMessage = {
      type: MasMessageType.AGENT_MEMORY_RESPONSE,
      payload: {
        agentId: 'a',
        snapshot: { memory: [] },
      },
    };

    AgentEventBus.dispatch(message);

    expect(handler).toHaveBeenCalledWith(message);
    expect(consoleInfo).toHaveBeenCalledWith(
      '[AgentEventBus] Dispatching',
      MasMessageType.AGENT_MEMORY_RESPONSE,
      message
    );
  });

  it('chiama handler per InstructionCompletedMessage', () => {
    const handler = vi.fn();
    AgentEventBus.on(MasMessageType.INSTRUCTION_COMPLETED, handler);

    const message: InstructionCompletedMessage = {
      type: MasMessageType.INSTRUCTION_COMPLETED,
      payload: {
        agentId: 'agent-2',
        taskId: 'task-123',
        result: { output: 'Done' },
      },
    };

    AgentEventBus.dispatch(message);
    expect(handler).toHaveBeenCalledWith(message);
  });

  it('chiama handler per InstructionFailedMessage', () => {
    const handler = vi.fn();
    AgentEventBus.on(MasMessageType.INSTRUCTION_FAILED, handler);

    const message: InstructionFailedMessage = {
      type: MasMessageType.INSTRUCTION_FAILED,
      payload: {
        agentId: 'agent-3',
        taskId: 'fail-task',
        reason: 'timeout',
      },
    };

    AgentEventBus.dispatch(message);
    expect(handler).toHaveBeenCalledWith(message);
  });

  it('logga warning per messaggio sconosciuto', () => {
    const message = {
      type: 'UNKNOWN_EVENT',
      payload: {},
    } as any;

    AgentEventBus.dispatch(message);

    expect(consoleWarn).toHaveBeenCalledWith(
      '[AgentEventBus] Nessun handler registrato per type: UNKNOWN_EVENT'
    );
  });
}); 