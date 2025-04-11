import { MultiAgentMessageType, MultiAgentMessageUnion } from './multi-agent-message';

export const isAgentStatusUpdatedMessage = (
  message: MultiAgentMessageUnion
): message is MultiAgentMessageUnion<MultiAgentMessageType.AGENT_STATUS_UPDATED> => {
  return message.type === MultiAgentMessageType.AGENT_STATUS_UPDATED;
};

export const isAgentErrorMessage = (
  message: MultiAgentMessageUnion
): message is MultiAgentMessageUnion<MultiAgentMessageType.AGENT_ERROR> => {
  return message.type === MultiAgentMessageType.AGENT_ERROR;
};