import { APIConfiguration, ModelInfo, ApiStreamChunk } from '@shared/types/api.types';

export enum ApiMessageType {
  SET_CONFIGURATION = 'set_configuration',
  GET_CONFIGURATION = 'get_configuration',
  LOAD_MODELS = 'load_models',
  SEND_MESSAGE = 'send_message',
  RESET = 'reset',
  API_ERROR = 'api_error',
  NAVIGATE = 'navigate',
  OPEN_ROUTE = 'open_route',
  TOGGLE_SIDEBAR = 'toggle_sidebar',
  TOGGLE_TERMINAL = 'toggle_terminal',
  SET_THEME = 'set_theme',
  SET_FONT_SIZE = 'set_font_size',
  FETCH_MODELS = 'fetch_models',
  CLEAR_MODEL_CACHE = 'clear_model_cache',
  PROMPT_PROFILES = 'prompt_profiles',
  PROMPT_PROFILE_UPDATED = 'prompt_profile_updated',
  TELEMETRY_DATA = 'telemetry_data',
  TELEMETRY_ERROR = 'telemetry_error'
}

export interface SetConfigurationMessage {
  type: ApiMessageType.SET_CONFIGURATION;
  payload: {
    config: Partial<APIConfiguration>;
  };
}

export interface GetConfigurationMessage {
  type: ApiMessageType.GET_CONFIGURATION;
}

export interface LoadModelsMessage {
  type: ApiMessageType.LOAD_MODELS;
  payload: {
    apiKey?: string;
  };
}

export interface SendMessageMessage {
  type: ApiMessageType.SEND_MESSAGE;
  payload: {
    message: string;
    modelId?: string;
    apiKey?: string;
  };
}

export interface ResetMessage {
  type: ApiMessageType.RESET;
}

export interface ApiErrorMessage {
  type: ApiMessageType.API_ERROR;
  payload: {
    error: string;
    details?: unknown;
  };
}

export interface NavigateMessage {
  type: ApiMessageType.NAVIGATE;
  payload: {
    route: string;
    params?: Record<string, string>;
  };
}

export interface OpenRouteMessage {
  type: ApiMessageType.OPEN_ROUTE;
  payload: {
    route: string;
  };
}

export interface ToggleSidebarMessage {
  type: ApiMessageType.TOGGLE_SIDEBAR;
  payload: {
    visible: boolean;
  };
}

export interface ToggleTerminalMessage {
  type: ApiMessageType.TOGGLE_TERMINAL;
  payload: {
    visible: boolean;
  };
}

export interface SetThemeMessage {
  type: ApiMessageType.SET_THEME;
  payload: {
    theme: 'light' | 'dark';
  };
}

export interface SetFontSizeMessage {
  type: ApiMessageType.SET_FONT_SIZE;
  payload: {
    size: number;
  };
}

export interface FetchModelsMessage {
  type: ApiMessageType.FETCH_MODELS;
  payload: {
    forceRefresh?: boolean;
  };
}

export interface ClearModelCacheMessage {
  type: ApiMessageType.CLEAR_MODEL_CACHE;
}

export interface PromptProfilesMessage {
  type: ApiMessageType.PROMPT_PROFILES;
  payload: {
    profiles: Array<{
      id: string;
      name: string;
      description: string;
      prompt: string;
    }>;
  };
}

export interface PromptProfileUpdatedMessage {
  type: ApiMessageType.PROMPT_PROFILE_UPDATED;
  payload: {
    profile: {
      id: string;
      name: string;
      description: string;
      prompt: string;
    };
  };
}

export interface TelemetryDataMessage {
  type: ApiMessageType.TELEMETRY_DATA;
  payload: {
    metrics: Record<string, number>;
    providers: string[];
  };
}

export interface TelemetryErrorMessage {
  type: ApiMessageType.TELEMETRY_ERROR;
  payload: {
    error: string;
    details?: unknown;
  };
}

export type ApiMessageUnion =
  | SetConfigurationMessage
  | GetConfigurationMessage
  | LoadModelsMessage
  | SendMessageMessage
  | ResetMessage
  | ApiErrorMessage
  | NavigateMessage
  | OpenRouteMessage
  | ToggleSidebarMessage
  | ToggleTerminalMessage
  | SetThemeMessage
  | SetFontSizeMessage
  | FetchModelsMessage
  | ClearModelCacheMessage
  | PromptProfilesMessage
  | PromptProfileUpdatedMessage
  | TelemetryDataMessage
  | TelemetryErrorMessage;

export function isApiMessage(message: unknown): message is ApiMessageUnion {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const { type, payload } = message as { type: string; payload: unknown };

  if (typeof type !== 'string' || !Object.values(ApiMessageType).includes(type as ApiMessageType)) {
    return false;
  }

  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  switch (type) {
    case ApiMessageType.NAVIGATE:
      return 'route' in payload;
    
    case ApiMessageType.OPEN_ROUTE:
      return 'route' in payload;
    
    case ApiMessageType.TOGGLE_SIDEBAR:
    case ApiMessageType.TOGGLE_TERMINAL:
      return 'visible' in payload;
    
    case ApiMessageType.SET_THEME:
      return 'theme' in payload;
    
    case ApiMessageType.SET_FONT_SIZE:
      return 'size' in payload;
    
    case ApiMessageType.FETCH_MODELS:
      return true; // Optional forceRefresh
    
    case ApiMessageType.CLEAR_MODEL_CACHE:
      return true; // No payload required
    
    case ApiMessageType.PROMPT_PROFILES:
      return 'profiles' in payload;
    
    case ApiMessageType.PROMPT_PROFILE_UPDATED:
      return 'profile' in payload;
    
    case ApiMessageType.TELEMETRY_DATA:
      return 'metrics' in payload && 'providers' in payload;
    
    case ApiMessageType.TELEMETRY_ERROR:
      return 'error' in payload;
    
    default:
      return false;
  }
}

// Type guards for specific message types
export function isSetConfigurationMessage(message: ApiMessageUnion): message is SetConfigurationMessage {
  return message.type === ApiMessageType.SET_CONFIGURATION;
}

export function isGetConfigurationMessage(message: ApiMessageUnion): message is GetConfigurationMessage {
  return message.type === ApiMessageType.GET_CONFIGURATION;
}

export function isLoadModelsMessage(message: ApiMessageUnion): message is LoadModelsMessage {
  return message.type === ApiMessageType.LOAD_MODELS;
}

export function isSendMessageMessage(message: ApiMessageUnion): message is SendMessageMessage {
  return message.type === ApiMessageType.SEND_MESSAGE;
}

export function isResetMessage(message: ApiMessageUnion): message is ResetMessage {
  return message.type === ApiMessageType.RESET;
}

export function isApiErrorMessage(message: ApiMessageUnion): message is ApiErrorMessage {
  return message.type === ApiMessageType.API_ERROR;
} 