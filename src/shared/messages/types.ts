// Tipi base per i messaggi
export interface BaseMessage {
  type: string;
  payload: unknown;
}

// Tipi specifici per i messaggi dell'estensione
export interface ExtensionMessage extends BaseMessage {
  payload: Record<string, unknown>;
}

// Tipi specifici per i messaggi della webview
export interface WebviewMessage extends BaseMessage {
  payload: Record<string, unknown>;
}

// Tipi per i messaggi di errore
export interface ErrorMessage extends BaseMessage {
  type: 'error';
  payload: {
    message: string;
    details?: unknown;
  };
}

// Tipi per i messaggi di navigazione
export interface NavigationMessage extends BaseMessage {
  type: 'navigate';
  payload: {
    route: string;
    params?: Record<string, string>;
  };
}

// Tipi per i messaggi di stato
export interface StateMessage extends BaseMessage {
  type: 'state';
  payload: Record<string, unknown>;
}

// Tipi per i messaggi dei prompt
export interface PromptProfile {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

export interface ExtensionPromptMessage extends ExtensionMessage {
  type: 'promptProfiles' | 'promptProfileUpdated';
  payload: {
    profiles?: PromptProfile[];
    profile?: PromptProfile;
    error?: string;
  };
}

/**
 * API message types
 */
export type ApiMessageType =
    | 'api.request'
    | 'api.response'
    | 'api.error'
    | 'api.stream.start'
    | 'api.stream.data'
    | 'api.stream.end';

/**
 * Base API message interface
 */
export interface ApiMessage {
    type: ApiMessageType;
    requestId: string;
    timestamp: number;
}

/**
 * API request message
 */
export interface ApiRequestMessage extends ApiMessage {
    type: 'api.request';
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, unknown>;
    body?: unknown;
}

/**
 * API response message
 */
export interface ApiResponseMessage extends ApiMessage {
    type: 'api.response';
    status: number;
    data: unknown;
}

/**
 * API error message
 */
export interface ApiErrorMessage extends ApiMessage {
    type: 'api.error';
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * API stream start message
 */
export interface ApiStreamStartMessage extends ApiMessage {
    type: 'api.stream.start';
    metadata?: Record<string, unknown>;
}

/**
 * API stream data message
 */
export interface ApiStreamDataMessage extends ApiMessage {
    type: 'api.stream.data';
    data: unknown;
}

/**
 * API stream end message
 */
export interface ApiStreamEndMessage extends ApiMessage {
    type: 'api.stream.end';
    metadata?: Record<string, unknown>;
}

/**
 * Union type of all API messages
 */
export type ApiMessageUnion =
    | ApiRequestMessage
    | ApiResponseMessage
    | ApiErrorMessage
    | ApiStreamStartMessage
    | ApiStreamDataMessage
    | ApiStreamEndMessage; 