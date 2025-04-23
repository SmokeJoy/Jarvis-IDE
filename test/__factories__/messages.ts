import { ResponseMessage, AgentTypingMessage, AgentTypingDoneMessage } from '@shared/messages';

export function createFakeResponseMessage(): ResponseMessage {
  return {
    type: 'RESPONSE',
    payload: {
      agentId: 'dev-agent',
      text: 'Mocked message',
      timestamp: Date.now(),
    },
  };
}

export function createFakeTypingMessage(agentId: string): AgentTypingMessage {
  return {
    type: 'AGENT_TYPING',
    payload: { agentId },
  };
}

export function createFakeTypingDoneMessage(agentId: string): AgentTypingDoneMessage {
  return {
    type: 'AGENT_TYPING_DONE',
    payload: { agentId },
  };
} 