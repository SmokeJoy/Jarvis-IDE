/**
 * @file mas-message-guards.ts
 * @description Type guards per la verifica dei tipi di messaggi MAS
 * @version 1.0.0
 */

import type { WebviewMessage } from '../../../src/shared/types/webview.types';
import { MasMessageType } from './mas-message';
import type {
  AgentMessageUnion,
  GetAgentsStatusMessage,
  GetTaskQueueStatusMessage,
  SendCoderInstructionMessage,
  AbortCoderInstructionMessage,
  ToggleAgentActiveMessage,
  SetAgentModeMessage,
  SetAgentStyleMessage,
  SetSystemModeMessage,
  SetDefaultStyleMessage,
  GetMasConfigurationMessage,
  AbortTaskMessage,
  RerunTaskMessage,
  SetTaskQueueFilterMessage,
  AgentsStatusUpdateMessage,
  TaskQueueUpdateMessage,
  InstructionReceivedMessage,
  InstructionCompletedMessage,
  InstructionFailedMessage,
  ConfigurationSavedMessage,
  ConfigurationErrorMessage,
  // Nuovi tipi di messaggi per M8-S2
  AgentRetryRequestMessage,
  AgentMemoryRequestMessage,
  AgentToggleDashboardMessage,
  AgentMemoryResponseMessage,
  AgentRetryResultMessage,
  // Nuovi tipi di messaggi per M9-S4
  AgentToggleEnableMessage,
  ErrorMessage
} from './mas-message';
import type { AgentMessageUnion as SharedAgentMessageUnion } from '@shared/messages';

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico MAS
 */
export function isMessageOfType<T extends AgentMessageUnion>(
  message: unknown,
  type: MasMessageType
): message is T {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === type
  );
}

/** Verifica se il messaggio è di tipo GetAgentsStatusMessage */
export function isGetAgentsStatusMessage(message: unknown): message is GetAgentsStatusMessage {
  return isMessageOfType<GetAgentsStatusMessage>(message, MasMessageType.GET_AGENTS_STATUS);
}

/** Verifica se il messaggio è di tipo GetTaskQueueStatusMessage */
export function isGetTaskQueueStatusMessage(message: unknown): message is GetTaskQueueStatusMessage {
  return isMessageOfType<GetTaskQueueStatusMessage>(message, MasMessageType.GET_TASK_QUEUE_STATUS);
}

/** Verifica se il messaggio è di tipo SendCoderInstructionMessage */
export function isSendCoderInstructionMessage(message: unknown): message is SendCoderInstructionMessage {
  return isMessageOfType<SendCoderInstructionMessage>(message, MasMessageType.SEND_CODER_INSTRUCTION);
}

/** Verifica se il messaggio è di tipo AbortCoderInstructionMessage */
export function isAbortCoderInstructionMessage(message: unknown): message is AbortCoderInstructionMessage {
  return isMessageOfType<AbortCoderInstructionMessage>(message, MasMessageType.ABORT_CODER_INSTRUCTION);
}

/** Verifica se il messaggio è di tipo ToggleAgentActiveMessage */
export function isToggleAgentActiveMessage(message: unknown): message is ToggleAgentActiveMessage {
  return isMessageOfType<ToggleAgentActiveMessage>(message, MasMessageType.TOGGLE_AGENT_ACTIVE);
}

/** Verifica se il messaggio è di tipo SetAgentModeMessage */
export function isSetAgentModeMessage(message: unknown): message is SetAgentModeMessage {
  return isMessageOfType<SetAgentModeMessage>(message, MasMessageType.SET_AGENT_MODE);
}

/** Verifica se il messaggio è di tipo SetAgentStyleMessage */
export function isSetAgentStyleMessage(message: unknown): message is SetAgentStyleMessage {
  return isMessageOfType<SetAgentStyleMessage>(message, MasMessageType.SET_AGENT_STYLE);
}

/** Verifica se il messaggio è di tipo SetSystemModeMessage */
export function isSetSystemModeMessage(message: unknown): message is SetSystemModeMessage {
  return isMessageOfType<SetSystemModeMessage>(message, MasMessageType.SET_SYSTEM_MODE);
}

/** Verifica se il messaggio è di tipo SetDefaultStyleMessage */
export function isSetDefaultStyleMessage(message: unknown): message is SetDefaultStyleMessage {
  return isMessageOfType<SetDefaultStyleMessage>(message, MasMessageType.SET_DEFAULT_STYLE);
}

/** Verifica se il messaggio è di tipo GetMasConfigurationMessage */
export function isGetMasConfigurationMessage(message: unknown): message is GetMasConfigurationMessage {
  return isMessageOfType<GetMasConfigurationMessage>(message, MasMessageType.GET_MAS_CONFIGURATION);
}

/** Verifica se il messaggio è di tipo AbortTaskMessage */
export function isAbortTaskMessage(message: unknown): message is AbortTaskMessage {
  return isMessageOfType<AbortTaskMessage>(message, MasMessageType.ABORT_TASK);
}

/** Verifica se il messaggio è di tipo RerunTaskMessage */
export function isRerunTaskMessage(message: unknown): message is RerunTaskMessage {
  return isMessageOfType<RerunTaskMessage>(message, MasMessageType.RERUN_TASK);
}

/** Verifica se il messaggio è di tipo SetTaskQueueFilterMessage */
export function isSetTaskQueueFilterMessage(message: unknown): message is SetTaskQueueFilterMessage {
  return isMessageOfType<SetTaskQueueFilterMessage>(message, MasMessageType.SET_TASK_QUEUE_FILTER);
}

/** Verifica se il messaggio è di tipo AgentsStatusUpdateMessage */
export function isAgentsStatusUpdateMessage(message: unknown): message is AgentsStatusUpdateMessage {
  return isMessageOfType<AgentsStatusUpdateMessage>(message, MasMessageType.AGENTS_STATUS_UPDATE);
}

/** Verifica se il messaggio è di tipo TaskQueueUpdateMessage */
export function isTaskQueueUpdateMessage(message: unknown): message is TaskQueueUpdateMessage {
  return isMessageOfType<TaskQueueUpdateMessage>(message, MasMessageType.TASK_QUEUE_UPDATE);
}

/** Verifica se il messaggio è di tipo InstructionReceivedMessage */
export function isInstructionReceivedMessage(message: unknown): message is InstructionReceivedMessage {
  return isMessageOfType<InstructionReceivedMessage>(message, MasMessageType.INSTRUCTION_RECEIVED);
}

/** Verifica se il messaggio è di tipo InstructionCompletedMessage */
export function isInstructionCompletedMessage(message: unknown): message is InstructionCompletedMessage {
  return isMessageOfType<InstructionCompletedMessage>(message, MasMessageType.INSTRUCTION_COMPLETED);
}

/** Verifica se il messaggio è di tipo InstructionFailedMessage */
export function isInstructionFailedMessage(message: unknown): message is InstructionFailedMessage {
  return isMessageOfType<InstructionFailedMessage>(message, MasMessageType.INSTRUCTION_FAILED);
}

/** Verifica se il messaggio è di tipo ConfigurationSavedMessage */
export function isConfigurationSavedMessage(message: unknown): message is ConfigurationSavedMessage {
  return isMessageOfType<ConfigurationSavedMessage>(message, MasMessageType.CONFIGURATION_SAVED);
}

/** Verifica se il messaggio è di tipo ConfigurationErrorMessage */
export function isConfigurationErrorMessage(message: unknown): message is ConfigurationErrorMessage {
  return isMessageOfType<ConfigurationErrorMessage>(message, MasMessageType.CONFIGURATION_ERROR);
}

/** Verifica se il messaggio è di tipo AgentRetryRequestMessage */
export function isAgentRetryRequestMessage(message: unknown): message is AgentRetryRequestMessage {
  return isMessageOfType<AgentRetryRequestMessage>(message, MasMessageType.AGENT_RETRY_REQUEST);
}

/** Verifica se il messaggio è di tipo AgentMemoryRequestMessage */
export function isAgentMemoryRequestMessage(message: unknown): message is AgentMemoryRequestMessage {
  return isMessageOfType<AgentMemoryRequestMessage>(message, MasMessageType.AGENT_MEMORY_REQUEST);
}

/** Verifica se il messaggio è di tipo AgentToggleDashboardMessage */
export function isAgentToggleDashboardMessage(message: unknown): message is AgentToggleDashboardMessage {
  return isMessageOfType<AgentToggleDashboardMessage>(message, MasMessageType.AGENT_TOGGLE_DASHBOARD);
}

/** Verifica se il messaggio è di tipo AgentMemoryResponseMessage */
export function isAgentMemoryResponseMessage(message: unknown): message is AgentMemoryResponseMessage {
  return isMessageOfType<AgentMemoryResponseMessage>(message, MasMessageType.AGENT_MEMORY_RESPONSE);
}

/** Verifica se il messaggio è di tipo AgentRetryResultMessage */
export function isAgentRetryResultMessage(message: unknown): message is AgentRetryResultMessage {
  return isMessageOfType<AgentRetryResultMessage>(message, MasMessageType.AGENT_RETRY_RESULT);
}

/** Verifica se il messaggio è di tipo AgentToggleEnableMessage */
export function isAgentToggleEnableMessage(message: unknown): message is AgentToggleEnableMessage {
  return isMessageOfType<AgentToggleEnableMessage>(message, MasMessageType.AGENT_TOGGLE_ENABLE);
}

/** Verifica se il messaggio è di tipo ErrorMessage */
export function isErrorMessage(message: unknown): message is ErrorMessage {
  return isMessageOfType<ErrorMessage>(message, MasMessageType.ERROR);
}

/**
 * Type guard per verificare se un oggetto è un messaggio MAS valido (union)
 */
export function isMasMessage(message: unknown): message is AgentMessageUnion {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    Object.values(MasMessageType).includes((message as { type: unknown }).type as MasMessageType)
  );
}

export function isAgentMessage(msg: unknown): msg is AgentMessageUnion {
  return typeof msg === 'object' && msg !== null && 'type' in msg;
} 