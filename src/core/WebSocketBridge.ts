import {
  WebviewMessageUnion,
  isWebviewMessage,
  isAgentMessage,
  isLlmCancelMessage
} from '@shared/types/messages-barrel';
import { handleIncomingMessage, registerHandler } from './dispatcher/WebviewDispatcher';
import { LlmCancelMessage, InstructionCompletedMessage } from '@shared/messages';

// Registrazione handler centralizzati (esempio, da eseguire in fase di bootstrap)
registerHandler('INSTRUCTION_COMPLETED', (msg) => {
  agentEventBus.emit('INSTRUCTION_COMPLETED', msg);
});
registerHandler('AGENT_TYPING', (msg) => {
  updateTypingState(msg.agentId, true);
});
registerHandler('AGENT_TYPING_DONE', (msg) => {
  updateTypingState(msg.agentId, false);
});
registerHandler('LLM_CANCEL', (msg) => {
  cancelPrompt((msg.payload as unknown).requestId);
});

export function notifySubscribers<T extends WebviewMessageUnion>(msg: unknown): void {
  if (!isWebviewMessage<T>(msg)) return;
  handleIncomingMessage(msg as WebviewMessageUnion);
}