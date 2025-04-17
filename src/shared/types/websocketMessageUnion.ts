import { BaseMessage } from './BaseMessage';

export type DisconnectMessage = BaseMessage<'websocket/disconnect'>;
export type WebSocketErrorMessage = BaseMessage<'websocket/error', { reason: string }>;
export type InstructionCompletedMessage = BaseMessage<'INSTRUCTION_COMPLETED', { taskId: string }>;
export type LlmCancelMessage = BaseMessage<'LLM_CANCEL', { requestId: string }>;

export type WebsocketMessageUnion =
  | DisconnectMessage
  | WebSocketErrorMessage
  | InstructionCompletedMessage
  | LlmCancelMessage; 