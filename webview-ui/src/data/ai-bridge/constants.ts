/**
 * @file constants.ts
 * @description Costanti per il modulo ai-bridge
 * @author dev ai 1
 */

import type { AiBridgeState } from './types';

// Stato iniziale del bridge AI
export const INITIAL_STATE: Readonly<AiBridgeState> = {
  requestId: null,
  status: 'idle',
  response: '',
  tokens: 0,
  error: undefined
} as const;

// Timeout per le richieste (ms)
export const REQUEST_TIMEOUT = 30000;

// Intervallo di polling per token updates (ms)
export const TOKEN_UPDATE_INTERVAL = 1000;

// Eventi del bridge AI
export const BRIDGE_EVENTS = {
  RESPONSE: 'response',
  ERROR: 'error',
  TOKEN_UPDATE: 'tokenUpdate',
  STATUS_CHANGE: 'statusChange'
} as const; 
 