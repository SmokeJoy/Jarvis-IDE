/**
 * @file mas-message.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi MAS
 * @version 1.0.0
 */

import type { WebviewMessage } from './webview.types';
import type { AgentStatus, Task, TaskQueueState, AgentMode, CodeStyle, PriorityLevel, MasConfig } from './mas-types';

/**
 * MAS message types
 */
export enum MasMessageType {
  // Agent status messages
  GET_AGENTS_STATUS = 'agent.status.get',
  AGENTS_STATUS_UPDATE = 'agent.status.update',
  
  // Memory messages
  GET_AGENT_MEMORY = 'agent.memory.get',
  AGENT_MEMORY_RESPONSE = 'agent.memory.response',
  CLEAR_AGENT_MEMORY = 'agent.memory.clear',
  
  // Task messages
  AGENT_TASK_START = 'agent.task.start',
  AGENT_TASK_UPDATE = 'agent.task.update',
  AGENT_TASK_COMPLETE = 'agent.task.complete',
  AGENT_TASK_ERROR = 'agent.task.error',
  
  // Control messages
  AGENT_TOGGLE_DASHBOARD = 'agent.toggle.dashboard',
  AGENT_RETRY_REQUEST = 'agent.retry.request',
  AGENT_RETRY_RESULT = 'agent.retry.result',
  
  // Debug messages
  AGENT_DEBUG_START = 'agent.debug.start',
  AGENT_DEBUG_STOP = 'agent.debug.stop',
  AGENT_DEBUG_UPDATE = 'agent.debug.update'
}

/**
 * Base MAS message interface
 */
export interface MasMessage {
  type: MasMessageType;
  timestamp: number;
  agentId?: string;
}

/**
 * Agent status message
 */
export interface AgentStatusMessage extends MasMessage {
  type: MasMessageType.AGENTS_STATUS_UPDATE;
  payload: {
    agents: Array<{
      id: string;
      status: 'idle' | 'busy' | 'error';
      currentTask?: string;
      error?: string;
    }>;
  };
}

/**
 * Agent memory message
 */
export interface AgentMemoryMessage extends MasMessage {
  type: MasMessageType.AGENT_MEMORY_RESPONSE;
  payload: {
    memories: Array<{
      id: string;
      content: string;
      timestamp: number;
      tags?: string[];
    }>;
  };
}

/**
 * Agent task message
 */
export interface AgentTaskMessage extends MasMessage {
  type: MasMessageType.AGENT_TASK_START | MasMessageType.AGENT_TASK_UPDATE | MasMessageType.AGENT_TASK_COMPLETE;
  payload: {
    taskId: string;
    status: 'started' | 'in_progress' | 'completed' | 'error';
    progress?: number;
    result?: unknown;
    error?: string;
  };
}

/**
 * Agent retry message
 */
export interface AgentRetryMessage extends MasMessage {
  type: MasMessageType.AGENT_RETRY_REQUEST | MasMessageType.AGENT_RETRY_RESULT;
  payload: {
    taskId: string;
    result?: unknown;
    error?: string;
  };
}

/**
 * Agent debug message
 */
export interface AgentDebugMessage extends MasMessage {
  type: MasMessageType.AGENT_DEBUG_START | MasMessageType.AGENT_DEBUG_STOP | MasMessageType.AGENT_DEBUG_UPDATE;
  payload: {
    debugId: string;
    data?: Record<string, unknown>;
    error?: string;
  };
}

/**
 * Union type of all MAS messages
 */
export type MasMessageUnion =
  | AgentStatusMessage
  | AgentMemoryMessage
  | AgentTaskMessage
  | AgentRetryMessage
  | AgentDebugMessage; 