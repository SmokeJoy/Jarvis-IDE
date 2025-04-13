/**
 * @file webview.types.ts
 * @description Definizioni per la comunicazione webview
 */

export enum WebviewMessageType {
  GET_STATE = 'GET_STATE',
  SET_STATE = 'SET_STATE',
  SEND_PROMPT = 'SEND_PROMPT',
  ACTION = 'ACTION',
  RESPONSE = 'RESPONSE',
  STATE_UPDATE = 'STATE_UPDATE',
  INSTRUCTION = 'INSTRUCTION',
  ERROR = 'ERROR',
}

export interface WebviewMessageBase {
  type: WebviewMessageType;
  timestamp: number;
}

export interface WebviewMessage<T = any> extends WebviewMessageBase {
  payload: T;
}

export interface ExtensionMessage<T = any> extends WebviewMessageBase {
  payload: T;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface WebviewState {
  theme: string;
  settings: Record<string, any>;
  systemPrompt: string;
  promptHistory: any[];
  chatHistory: any[];
  taskQueue: any;
}

export interface WebviewProps {
  config?: Record<string, any>;
}

export interface Theme {
  type: 'light' | 'dark';
  colors: Record<string, string>;
}

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'error';
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error';
  memory?: Record<string, any>;
}

export interface TaskQueueState {
  tasks: any[];
  running: boolean;
  aborted: boolean;
  lastUpdated: number;
}

// Re-esporta tutto dal file centralizzato
export * from '../shared/types/webview.types';

// Questo file è mantenuto solo per retrocompatibilità con il codice esistente
// e non dovrebbe avere definizioni proprie per evitare duplicazioni.
