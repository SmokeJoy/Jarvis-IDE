import {
  WebviewMessageUnion,
  isWebviewMessage,
  isAgentMessage,
  isLlmCancelMessage
} from '@shared/types/webviewMessageUnion';

export function notifySubscribers<T extends WebviewMessageUnion>(msg: unknown): void {
  if (!isWebviewMessage<T>(msg)) return;

  switch (msg.type) {
    case 'INSTRUCTION_COMPLETED':
      agentEventBus.emit('INSTRUCTION_COMPLETED', msg);
      break;
    case 'AGENT_TYPING':
      updateTypingState(msg.agentId, true);
      break;
    case 'AGENT_TYPING_DONE':
      updateTypingState(msg.agentId, false);
      break;
    case 'LLM_CANCEL':
      cancelPrompt(msg.payload.requestId);
      break;
    default:
      console.warn('[WebSocketBridge] Messaggio non gestito:', msg);
  }
} 