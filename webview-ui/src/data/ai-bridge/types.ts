/**
 * @file types.ts
 * @description Tipi centralizzati per il modulo ai-bridge
 * @author dev ai 1
 */

import type { WebviewBridge } from '@shared/utils/WebviewBridge';
import type { AiResponse, AiRequest } from '@shared/messages';

// Stato della richiesta AI
export type AiRequestStatus = 'idle' | 'pending' | 'streaming' | 'done' | 'error';

// Stato del bridge AI
export interface AiBridgeState {
  requestId: string | null;
  status: AiRequestStatus;
  response: string;
  tokens: number;
  error?: string;
}

// Contesto del bridge AI
export interface AiBridgeContext {
  bridge: WebviewBridge;
  state: {
    getState: () => AiBridgeState;
    setStatus: (status: AiRequestStatus) => void;
    setResponse: (response: string) => void;
    setError: (error: string) => void;
    updateTokens: (tokens: number) => void;
    reset: () => void;
  };
}

// Opzioni per la creazione del bridge AI
export interface AiBridgeOptions {
  bridge: WebviewBridge;
  onResponse?: (response: AiResponse) => void;
  onError?: (error: string) => void;
  onTokenUpdate?: (tokens: number) => void;
  onStatusChange?: (status: AiRequestStatus) => void;
}

// Eventi emessi dal bridge AI
export type AiBridgeEvent = 
  | { type: 'response'; payload: AiResponse }
  | { type: 'error'; payload: string }
  | { type: 'tokenUpdate'; payload: number }
  | { type: 'statusChange'; payload: AiRequestStatus };

// Listener per gli eventi
export type AiBridgeEventListener = (event: AiBridgeEvent) => void; 
 