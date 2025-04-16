import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentEventBus, resetAgentEventBusHandlers, registerAgentHandler } from '@/core/AgentEventBus';
import { MasMessageType } from '@shared/types/mas-message';
import type {
  AgentMemoryResponseMessage,
  InstructionCompletedMessage,
  InstructionFailedMessage,
} from '@shared/types/mas-message';

describe('AgentEventBus', () => {
  const memoryMessage: AgentMemoryResponseMessage = {
    type: MasMessageType.AGENT_MEMORY_RESPONSE,
    payload: {
      agentId: 'agent-01',
      memory: [{ key: 'project', value: 'Jarvis' }],
    },
  };

  const instructionDoneMessage: InstructionCompletedMessage = {
    type: MasMessageType.INSTRUCTION_COMPLETED,
    payload: {
      taskId: 'task-01',
      agentId: 'agent-01',
    },
  };

  const instructionFailedMessage: InstructionFailedMessage = {
    type: MasMessageType.INSTRUCTION_FAILED,
    payload: {
      taskId: 'task-02',
      reason: 'Timeout',
      agentId: 'agent-02',
    },
  };

  const unknownMessage = {
    type: 'UNKNOWN_EVENT',
    payload: {},
  };

  const spyMemory = vi.fn();
  const spyCompleted = vi.fn();
  const spyFailed = vi.fn();
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    resetAgentEventBusHandlers();
    warnSpy.mockClear();
    spyMemory.mockClear();
    spyCompleted.mockClear();
    spyFailed.mockClear();
  });

  it('calls handler for AgentMemoryResponseMessage', () => {
    registerAgentHandler(MasMessageType.AGENT_MEMORY_RESPONSE, spyMemory);
    AgentEventBus.dispatch(memoryMessage);
    expect(spyMemory).toHaveBeenCalledWith(memoryMessage);
  });

  it('calls handler for InstructionCompletedMessage', () => {
    registerAgentHandler(MasMessageType.INSTRUCTION_COMPLETED, spyCompleted);
    AgentEventBus.dispatch(instructionDoneMessage);
    expect(spyCompleted).toHaveBeenCalledWith(instructionDoneMessage);
  });

  it('calls handler for InstructionFailedMessage', () => {
    registerAgentHandler(MasMessageType.INSTRUCTION_FAILED, spyFailed);
    AgentEventBus.dispatch(instructionFailedMessage);
    expect(spyFailed).toHaveBeenCalledWith(instructionFailedMessage);
  });

  it('logs a warning for unknown message type', () => {
    AgentEventBus.dispatch(unknownMessage as any);
    expect(warnSpy).toHaveBeenCalledWith('[AgentEventBus] No handler for type:', 'UNKNOWN_EVENT');
  });
}); 