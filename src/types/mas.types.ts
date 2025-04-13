/**
 * @file mas.types.ts
 * @description Definizioni per il sistema multi-agente
 */

export enum AgentStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  BUSY = 'busy',
  ERROR = 'error',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
  capabilities: string[];
  priority: PriorityLevel;
}

export interface TaskQueueState {
  tasks: Task[];
  isPaused: boolean;
  currentTask?: Task;
}

export interface Task {
  id: string;
  agentId: string;
  instruction: string;
  priority: PriorityLevel;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}
