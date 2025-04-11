/**
 * @file mas-message-guards.ts
 * @description Type guards per la verifica dei tipi di messaggi MAS
 * @version 1.0.0
 */

import type { WebviewMessage } from '../../../src/shared/types/webview.types';
import { 
  MasMessageType,
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

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico MAS
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio atteso
 * @returns True se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends AgentMessageUnion>(
  message: WebviewMessage<any>, 
  type: MasMessageType
): message is T {
  return message?.type === type;
}

/**
 * Type guard per verificare se un messaggio è un GetAgentsStatusMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un GetAgentsStatusMessage
 */
export function isGetAgentsStatusMessage(message: WebviewMessage<any>): message is GetAgentsStatusMessage {
  return isMessageOfType<GetAgentsStatusMessage>(message, MasMessageType.GET_AGENTS_STATUS);
}

/**
 * Type guard per verificare se un messaggio è un GetTaskQueueStatusMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un GetTaskQueueStatusMessage
 */
export function isGetTaskQueueStatusMessage(message: WebviewMessage<any>): message is GetTaskQueueStatusMessage {
  return isMessageOfType<GetTaskQueueStatusMessage>(message, MasMessageType.GET_TASK_QUEUE_STATUS);
}

/**
 * Type guard per verificare se un messaggio è un SendCoderInstructionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SendCoderInstructionMessage
 */
export function isSendCoderInstructionMessage(message: WebviewMessage<any>): message is SendCoderInstructionMessage {
  return isMessageOfType<SendCoderInstructionMessage>(message, MasMessageType.SEND_CODER_INSTRUCTION);
}

/**
 * Type guard per verificare se un messaggio è un AbortCoderInstructionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AbortCoderInstructionMessage
 */
export function isAbortCoderInstructionMessage(message: WebviewMessage<any>): message is AbortCoderInstructionMessage {
  return isMessageOfType<AbortCoderInstructionMessage>(message, MasMessageType.ABORT_CODER_INSTRUCTION);
}

/**
 * Type guard per verificare se un messaggio è un ToggleAgentActiveMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ToggleAgentActiveMessage
 */
export function isToggleAgentActiveMessage(message: WebviewMessage<any>): message is ToggleAgentActiveMessage {
  return isMessageOfType<ToggleAgentActiveMessage>(message, MasMessageType.TOGGLE_AGENT_ACTIVE);
}

/**
 * Type guard per verificare se un messaggio è un SetAgentModeMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SetAgentModeMessage
 */
export function isSetAgentModeMessage(message: WebviewMessage<any>): message is SetAgentModeMessage {
  return isMessageOfType<SetAgentModeMessage>(message, MasMessageType.SET_AGENT_MODE);
}

/**
 * Type guard per verificare se un messaggio è un SetAgentStyleMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SetAgentStyleMessage
 */
export function isSetAgentStyleMessage(message: WebviewMessage<any>): message is SetAgentStyleMessage {
  return isMessageOfType<SetAgentStyleMessage>(message, MasMessageType.SET_AGENT_STYLE);
}

/**
 * Type guard per verificare se un messaggio è un SetSystemModeMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SetSystemModeMessage
 */
export function isSetSystemModeMessage(message: WebviewMessage<any>): message is SetSystemModeMessage {
  return isMessageOfType<SetSystemModeMessage>(message, MasMessageType.SET_SYSTEM_MODE);
}

/**
 * Type guard per verificare se un messaggio è un SetDefaultStyleMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SetDefaultStyleMessage
 */
export function isSetDefaultStyleMessage(message: WebviewMessage<any>): message is SetDefaultStyleMessage {
  return isMessageOfType<SetDefaultStyleMessage>(message, MasMessageType.SET_DEFAULT_STYLE);
}

/**
 * Type guard per verificare se un messaggio è un GetMasConfigurationMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un GetMasConfigurationMessage
 */
export function isGetMasConfigurationMessage(message: WebviewMessage<any>): message is GetMasConfigurationMessage {
  return isMessageOfType<GetMasConfigurationMessage>(message, MasMessageType.GET_MAS_CONFIGURATION);
}

/**
 * Type guard per verificare se un messaggio è un AbortTaskMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AbortTaskMessage
 */
export function isAbortTaskMessage(message: WebviewMessage<any>): message is AbortTaskMessage {
  return isMessageOfType<AbortTaskMessage>(message, MasMessageType.ABORT_TASK);
}

/**
 * Type guard per verificare se un messaggio è un RerunTaskMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un RerunTaskMessage
 */
export function isRerunTaskMessage(message: WebviewMessage<any>): message is RerunTaskMessage {
  return isMessageOfType<RerunTaskMessage>(message, MasMessageType.RERUN_TASK);
}

/**
 * Type guard per verificare se un messaggio è un SetTaskQueueFilterMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SetTaskQueueFilterMessage
 */
export function isSetTaskQueueFilterMessage(message: WebviewMessage<any>): message is SetTaskQueueFilterMessage {
  return isMessageOfType<SetTaskQueueFilterMessage>(message, MasMessageType.SET_TASK_QUEUE_FILTER);
}

/**
 * Type guard per verificare se un messaggio è un AgentsStatusUpdateMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentsStatusUpdateMessage
 */
export function isAgentsStatusUpdateMessage(message: WebviewMessage<any>): message is AgentsStatusUpdateMessage {
  return isMessageOfType<AgentsStatusUpdateMessage>(message, MasMessageType.AGENTS_STATUS_UPDATE);
}

/**
 * Type guard per verificare se un messaggio è un TaskQueueUpdateMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un TaskQueueUpdateMessage
 */
export function isTaskQueueUpdateMessage(message: WebviewMessage<any>): message is TaskQueueUpdateMessage {
  return isMessageOfType<TaskQueueUpdateMessage>(message, MasMessageType.TASK_QUEUE_UPDATE);
}

/**
 * Type guard per verificare se un messaggio è un InstructionReceivedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionReceivedMessage
 */
export function isInstructionReceivedMessage(message: WebviewMessage<any>): message is InstructionReceivedMessage {
  return isMessageOfType<InstructionReceivedMessage>(message, MasMessageType.INSTRUCTION_RECEIVED);
}

/**
 * Type guard per verificare se un messaggio è un InstructionCompletedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionCompletedMessage
 */
export function isInstructionCompletedMessage(message: WebviewMessage<any>): message is InstructionCompletedMessage {
  return isMessageOfType<InstructionCompletedMessage>(message, MasMessageType.INSTRUCTION_COMPLETED);
}

/**
 * Type guard per verificare se un messaggio è un InstructionFailedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionFailedMessage
 */
export function isInstructionFailedMessage(message: WebviewMessage<any>): message is InstructionFailedMessage {
  return isMessageOfType<InstructionFailedMessage>(message, MasMessageType.INSTRUCTION_FAILED);
}

/**
 * Type guard per verificare se un messaggio è un ConfigurationSavedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ConfigurationSavedMessage
 */
export function isConfigurationSavedMessage(message: WebviewMessage<any>): message is ConfigurationSavedMessage {
  return isMessageOfType<ConfigurationSavedMessage>(message, MasMessageType.CONFIGURATION_SAVED);
}

/**
 * Type guard per verificare se un messaggio è un ConfigurationErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ConfigurationErrorMessage
 */
export function isConfigurationErrorMessage(message: WebviewMessage<any>): message is ConfigurationErrorMessage {
  return isMessageOfType<ConfigurationErrorMessage>(message, MasMessageType.CONFIGURATION_ERROR);
}

/**
 * Type guard generico per verificare se un messaggio è un messaggio MAS
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentMessageUnion
 */
export function isAgentMessage(message: WebviewMessage<any>): message is AgentMessageUnion {
  return Object.values(MasMessageType).includes(message?.type as MasMessageType);
}

/**
 * Type guard per verificare se un messaggio è un AgentRetryRequestMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentRetryRequestMessage
 */
export function isAgentRetryRequestMessage(message: WebviewMessage<any>): message is AgentRetryRequestMessage {
  return isMessageOfType<AgentRetryRequestMessage>(message, MasMessageType.AGENT_RETRY_REQUEST);
}

/**
 * Type guard per verificare se un messaggio è un AgentMemoryRequestMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentMemoryRequestMessage
 */
export function isAgentMemoryRequestMessage(message: WebviewMessage<any>): message is AgentMemoryRequestMessage {
  return isMessageOfType<AgentMemoryRequestMessage>(message, MasMessageType.AGENT_MEMORY_REQUEST);
}

/**
 * Type guard per verificare se un messaggio è un AgentToggleDashboardMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentToggleDashboardMessage
 */
export function isAgentToggleDashboardMessage(message: WebviewMessage<any>): message is AgentToggleDashboardMessage {
  return isMessageOfType<AgentToggleDashboardMessage>(message, MasMessageType.AGENT_TOGGLE_DASHBOARD);
}

/**
 * Type guard per verificare se un messaggio è un AgentMemoryResponseMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentMemoryResponseMessage
 */
export function isAgentMemoryResponseMessage(message: WebviewMessage<any>): message is AgentMemoryResponseMessage {
  return isMessageOfType<AgentMemoryResponseMessage>(message, MasMessageType.AGENT_MEMORY_RESPONSE);
}

/**
 * Type guard per verificare se un messaggio è un AgentRetryResultMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentRetryResultMessage
 */
export function isAgentRetryResultMessage(message: WebviewMessage<any>): message is AgentRetryResultMessage {
  return isMessageOfType<AgentRetryResultMessage>(message, MasMessageType.AGENT_RETRY_RESULT);
}

/**
 * Type guard per verificare se un messaggio è un AgentToggleEnableMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un AgentToggleEnableMessage
 * @added M9-S4
 */
export function isAgentToggleEnableMessage(message: WebviewMessage<any>): message is AgentToggleEnableMessage {
  return isMessageOfType<AgentToggleEnableMessage>(message, MasMessageType.AGENT_TOGGLE_ENABLE);
}

/**
 * Type guard per verificare se un messaggio è un ErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ErrorMessage
 */
export function isErrorMessage(message: WebviewMessage<any>): message is ErrorMessage {
  return isMessageOfType<ErrorMessage>(message, MasMessageType.ERROR);
} 