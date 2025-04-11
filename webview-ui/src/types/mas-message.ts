/**
 * @file mas-message.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi MAS
 * @version 1.0.0
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import type { AgentStatus, Task, TaskQueueState, AgentMode, CodeStyle, PriorityLevel, MasConfig } from './mas-types';

/**
 * Enum per i tipi di messaggi del sistema MAS
 */
export enum MasMessageType {
  // Richieste al backend
  GET_AGENTS_STATUS = 'getAgentsStatus',
  GET_TASK_QUEUE_STATUS = 'getTaskQueueStatus',
  SEND_CODER_INSTRUCTION = 'sendCoderInstruction',
  ABORT_CODER_INSTRUCTION = 'abortCoderInstruction',
  TOGGLE_AGENT_ACTIVE = 'toggleAgentActive',
  SET_AGENT_MODE = 'setAgentMode',
  SET_AGENT_STYLE = 'setAgentStyle',
  SET_SYSTEM_MODE = 'setSystemMode',
  SET_DEFAULT_STYLE = 'setDefaultStyle',
  GET_MAS_CONFIGURATION = 'getMasConfiguration',
  ABORT_TASK = 'abortTask',
  RERUN_TASK = 'rerunTask',
  SET_TASK_QUEUE_FILTER = 'setTaskQueueFilter',
  
  // Nuovi tipi di messaggi per il dashboard dell'AgentPanel (M8-S2)
  AGENT_RETRY_REQUEST = 'agentRetryRequest',
  AGENT_MEMORY_REQUEST = 'agentMemoryRequest',
  AGENT_TOGGLE_DASHBOARD = 'agentToggleDashboard',
  
  // Nuovo tipo per M9-S4
  AGENT_TOGGLE_ENABLE = 'agentToggleEnable',
  
  // Risposte dal backend
  AGENTS_STATUS_UPDATE = 'agentsStatusUpdate',
  TASK_QUEUE_UPDATE = 'taskQueueUpdate',
  INSTRUCTION_RECEIVED = 'instructionReceived',
  INSTRUCTION_COMPLETED = 'instructionCompleted',
  INSTRUCTION_FAILED = 'instructionFailed',
  CONFIGURATION_SAVED = 'configurationSaved',
  CONFIGURATION_ERROR = 'configurationError',
  ERROR = 'error',
  
  // Nuove risposte per il dashboard (M8-S2)
  AGENT_MEMORY_RESPONSE = 'agentMemoryResponse',
  AGENT_RETRY_RESULT = 'agentRetryResult'
}

/**
 * Interfaccia base per tutti i messaggi MAS
 */
export interface MasMessageBase extends WebviewMessageUnion {
  type: MasMessageType | string;
}

/**
 * Messaggio per richiedere lo stato degli agenti
 */
export interface GetAgentsStatusMessage extends MasMessageBase {
  type: MasMessageType.GET_AGENTS_STATUS;
}

/**
 * Messaggio per richiedere lo stato della coda dei task
 */
export interface GetTaskQueueStatusMessage extends MasMessageBase {
  type: MasMessageType.GET_TASK_QUEUE_STATUS;
}

/**
 * Messaggio per inviare un'istruzione al CoderAgent
 */
export interface SendCoderInstructionMessage extends MasMessageBase {
  type: MasMessageType.SEND_CODER_INSTRUCTION;
  payload: {
    instruction: string;
    style?: CodeStyle;
    priority?: PriorityLevel;
  };
}

/**
 * Messaggio per interrompere l'istruzione corrente
 */
export interface AbortCoderInstructionMessage extends MasMessageBase {
  type: MasMessageType.ABORT_CODER_INSTRUCTION;
}

/**
 * Messaggio per attivare/disattivare un agente
 */
export interface ToggleAgentActiveMessage extends MasMessageBase {
  type: MasMessageType.TOGGLE_AGENT_ACTIVE;
  payload: {
    agentId: string;
    active: boolean;
  };
}

/**
 * Messaggio per impostare la modalità di un agente
 */
export interface SetAgentModeMessage extends MasMessageBase {
  type: MasMessageType.SET_AGENT_MODE;
  payload: {
    agentId: string;
    mode: AgentMode;
  };
}

/**
 * Messaggio per impostare lo stile di codice di un agente
 */
export interface SetAgentStyleMessage extends MasMessageBase {
  type: MasMessageType.SET_AGENT_STYLE;
  payload: {
    agentId: string;
    style: CodeStyle;
  };
}

/**
 * Messaggio per impostare la modalità del sistema MAS
 */
export interface SetSystemModeMessage extends MasMessageBase {
  type: MasMessageType.SET_SYSTEM_MODE;
  payload: {
    mode: 'collaborative' | 'single';
  };
}

/**
 * Messaggio per impostare lo stile di codice predefinito
 */
export interface SetDefaultStyleMessage extends MasMessageBase {
  type: MasMessageType.SET_DEFAULT_STYLE;
  payload: {
    style: CodeStyle;
  };
}

/**
 * Messaggio per richiedere la configurazione MAS
 */
export interface GetMasConfigurationMessage extends MasMessageBase {
  type: MasMessageType.GET_MAS_CONFIGURATION;
}

/**
 * Messaggio per interrompere un task
 */
export interface AbortTaskMessage extends MasMessageBase {
  type: MasMessageType.ABORT_TASK;
  payload: {
    taskId: string;
  };
}

/**
 * Messaggio per rieseguire un task
 */
export interface RerunTaskMessage extends MasMessageBase {
  type: MasMessageType.RERUN_TASK;
  payload: {
    task: Task;
  };
}

/**
 * Messaggio per impostare i filtri della coda di task
 */
export interface SetTaskQueueFilterMessage extends MasMessageBase {
  type: MasMessageType.SET_TASK_QUEUE_FILTER;
  payload: {
    status?: 'all' | 'pending' | 'active' | 'completed' | 'failed';
    priority?: 'all' | 'high' | 'normal' | 'low';
    agentId?: string;
  };
}

/**
 * Messaggio di aggiornamento dello stato degli agenti
 */
export interface AgentsStatusUpdateMessage extends MasMessageBase {
  type: MasMessageType.AGENTS_STATUS_UPDATE;
  payload: AgentStatus[];
}

/**
 * Messaggio di aggiornamento della coda dei task
 */
export interface TaskQueueUpdateMessage extends MasMessageBase {
  type: MasMessageType.TASK_QUEUE_UPDATE;
  payload: TaskQueueState;
}

/**
 * Messaggio per istruzione ricevuta
 */
export interface InstructionReceivedMessage extends MasMessageBase {
  type: MasMessageType.INSTRUCTION_RECEIVED;
  payload: {
    id: string;
    agentId: string;
    instruction: string;
  };
}

/**
 * Messaggio per istruzione completata
 */
export interface InstructionCompletedMessage extends MasMessageBase {
  type: MasMessageType.INSTRUCTION_COMPLETED;
  payload: {
    id: string;
    agentId: string;
    instruction: string;
    result: string;
  };
}

/**
 * Messaggio per istruzione fallita
 */
export interface InstructionFailedMessage extends MasMessageBase {
  type: MasMessageType.INSTRUCTION_FAILED;
  payload: {
    id: string;
    agentId: string;
    instruction: string;
    error: string;
  };
}

/**
 * Messaggio per configurazione salvata
 */
export interface ConfigurationSavedMessage extends MasMessageBase {
  type: MasMessageType.CONFIGURATION_SAVED;
  payload: {
    config: MasConfig;
  };
}

/**
 * Messaggio per errore di configurazione
 */
export interface ConfigurationErrorMessage extends MasMessageBase {
  type: MasMessageType.CONFIGURATION_ERROR;
  payload: {
    error: string;
  };
}

/**
 * Messaggio per richiedere il retry di un task specifico di un agente
 */
export interface AgentRetryRequestMessage extends MasMessageBase {
  type: MasMessageType.AGENT_RETRY_REQUEST;
  payload: {
    agentId: string;
    taskId: string;
    useNewParams?: boolean;
    newParams?: {
      style?: CodeStyle;
      priority?: PriorityLevel;
    };
  };
}

/**
 * Messaggio per richiedere la memoria/cronologia di un agente specifico
 */
export interface AgentMemoryRequestMessage extends MasMessageBase {
  type: MasMessageType.AGENT_MEMORY_REQUEST;
  payload: {
    agentId: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Messaggio per attivare/disattivare un agente dal dashboard
 */
export interface AgentToggleDashboardMessage extends MasMessageBase {
  type: MasMessageType.AGENT_TOGGLE_DASHBOARD;
  payload: {
    agentId: string;
    active: boolean;
    dashboardOnly?: boolean; // Se true, aggiorna solo l'UI senza effetti sul backend
  };
}

/**
 * Messaggio di risposta con la memoria/cronologia di un agente
 */
export interface AgentMemoryResponseMessage extends MasMessageBase {
  type: MasMessageType.AGENT_MEMORY_RESPONSE;
  payload: {
    agentId: string;
    memory: Array<{
      id: string;
      timestamp: number;
      task: Task;
      result?: any;
    }>;
    total: number;
  };
}

/**
 * Messaggio di risposta al retry di un task
 */
export interface AgentRetryResultMessage extends MasMessageBase {
  type: MasMessageType.AGENT_RETRY_RESULT;
  payload: {
    agentId: string;
    taskId: string;
    newTaskId?: string;
    success: boolean;
    message?: string;
  };
}

/**
 * Messaggio per abilitare/disabilitare un agente
 * @added M9-S4
 */
export interface AgentToggleEnableMessage extends MasMessageBase {
  type: MasMessageType.AGENT_TOGGLE_ENABLE;
  payload: {
    agentId: string;
    enabled: boolean;
  };
}

/**
 * Messaggio di errore generico
 */
export interface ErrorMessage extends MasMessageBase {
  type: MasMessageType.ERROR;
  payload: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Unione di tutti i tipi di messaggi MAS (utilizzata per le type guards)
 */
export type AgentMessageUnion =
  | GetAgentsStatusMessage
  | GetTaskQueueStatusMessage
  | SendCoderInstructionMessage
  | AbortCoderInstructionMessage
  | ToggleAgentActiveMessage
  | SetAgentModeMessage
  | SetAgentStyleMessage
  | SetSystemModeMessage
  | SetDefaultStyleMessage
  | GetMasConfigurationMessage
  | AbortTaskMessage
  | RerunTaskMessage
  | SetTaskQueueFilterMessage
  | AgentsStatusUpdateMessage
  | TaskQueueUpdateMessage
  | InstructionReceivedMessage
  | InstructionCompletedMessage
  | InstructionFailedMessage
  | ConfigurationSavedMessage
  | ConfigurationErrorMessage
  | ErrorMessage
  // Nuovi tipi aggiunti per M8-S2
  | AgentRetryRequestMessage
  | AgentMemoryRequestMessage
  | AgentToggleDashboardMessage
  | AgentMemoryResponseMessage
  | AgentRetryResultMessage
  // Nuovi tipi aggiunti per M9-S4
  | AgentToggleEnableMessage; 