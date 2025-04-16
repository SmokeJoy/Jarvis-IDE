import { MultiAgentMessageType, MultiAgentMessage } from './multi-agent-message';

/** Type guard per AGENT_STATUS_UPDATE */
export function isAgentStatusUpdateMessage(
  message: MultiAgentMessage
): message is Extract<MultiAgentMessage, { type: MultiAgentMessageType.AGENT_STATUS_UPDATE }> {
  // Use correct enum member
  return message.type === MultiAgentMessageType.AGENT_STATUS_UPDATE;
}

/** Type guard per AGENT_RESPONSE */
/* Commented out because AGENT_RESPONSE doesn't seem to exist in MultiAgentMessageType
export function isAgentResponseMessage(
  message: MultiAgentMessage
): message is Extract<MultiAgentMessage, { type: MultiAgentMessageType.AGENT_RESPONSE }> {
  return message.type === MultiAgentMessageType.AGENT_RESPONSE;
}
*/

/** Type guard per AGENT_ERROR (assuming AGENT_ERROR exists or should be added) */
// export function isAgentErrorMessag(message: MultiAgentMessage): message is Extract<...> { ... }
// Commented out as AGENT_ERROR doesn't seem to exist in the enum based on previous errors
