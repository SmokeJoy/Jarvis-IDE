/**
 * Tipi condivisi tra il backend e la WebView
 */

import { TaskStatus } from '../../src/shared/types/task-queue.types';

/**
 * Livello di priorità dei task
 */
export type PriorityLevel = 'high' | 'normal' | 'low';

/**
 * Modalità di operazione di un agente
 */
export type AgentMode = 'autonomous' | 'supervised' | 'interactive';

/**
 * Stile di codice utilizzato dagli agenti
 */
export type CodeStyle = 'standard' | 'compact' | 'verbose' | 'documented';

/**
 * Stato di un agente
 */
export interface AgentStatus {
  /** Identificatore unico dell'agente */
  id: string;
  /** Nome dell'agente */
  name: string;
  /** Modalità di operazione */
  mode: AgentMode;
  /** Indica se l'agente è attivo */
  isActive: boolean;
  /** Task attualmente in esecuzione */
  currentTask?: string;
  /** Timestamp dell'ultima attività */
  lastActivity?: Date;
  /** Agenti da cui dipende */
  dependencies: string[];
  /** Avvisi o problemi */
  warnings: string[];
}

/**
 * Istruzione per un agente
 */
export interface Instruction {
  /** Identificatore unico dell'istruzione */
  id: string;
  /** Contenuto dell'istruzione */
  content: string;
  /** Timestamp di creazione */
  createdAt: Date;
  /** Agente a cui è destinata */
  agentId: string;
  /** Stile di codice richiesto */
  style?: CodeStyle;
  /** Priorità dell'istruzione */
  priority?: PriorityLevel;
}

/**
 * Risultato di un task
 */
export interface TaskResult {
  /** Identificatore unico del risultato */
  id: string;
  /** Spiegazione delle azioni intraprese */
  explanation: string;
  /** Suggerimenti per l'utente */
  suggestions?: string[];
  /** File modificati */
  modifiedFiles?: string[];
  /** File creati */
  createdFiles?: string[];
  /** Eventuali warning */
  warnings?: string[];
}

/**
 * Task per un agente
 */
export interface Task {
  /** Identificatore unico del task */
  id: string;
  /** Stato del task */
  status: TaskStatus;
  /** Errore in caso di fallimento */
  error?: string;
  /** Timestamp di creazione */
  timestamp: number;
}

/**
 * Stato della coda dei task per la WebView
 */
export interface TaskQueueState {
  /** Lista dei task */
  tasks: Task[];
  /** Indica se la coda è in esecuzione */
  running: boolean;
  /** Indica se la coda è stata interrotta */
  aborted: boolean;
  /** Timestamp dell'ultimo aggiornamento */
  lastUpdated: number;
} 