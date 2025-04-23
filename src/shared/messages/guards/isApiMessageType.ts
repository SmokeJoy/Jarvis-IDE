import { z } from 'zod';
import { ApiMessageType, type ApiMessage, type ApiMessageInterface } from '../../types/api.types';
import { logger } from '../../utils/logger';

// Base schema for all API messages
const apiMessageBaseSchema = z.object({
  type: z.nativeEnum(ApiMessageType),
  payload: z.record(z.unknown()),
  error: z.string().optional(),
  timestamp: z.number().optional()
});

// Configuration message schemas
const setConfigurationSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.SET_CONFIGURATION),
  payload: z.object({
    config: z.any() // TODO: Define APIConfiguration schema
  })
});

const getConfigurationSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.GET_CONFIGURATION),
  payload: z.record(z.never())
});

// Model message schemas
const loadModelsSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.LOAD_MODELS),
  payload: z.object({
    models: z.array(z.any()) // TODO: Define ModelInfo schema
  })
});

const fetchModelsSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.FETCH_MODELS),
  payload: z.object({
    force: z.boolean().optional()
  })
});

const clearModelCacheSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.CLEAR_MODEL_CACHE),
  payload: z.record(z.never())
});

// Chat message schemas
const sendMessageSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.SEND_MESSAGE),
  payload: z.object({
    message: z.string(),
    modelId: z.string().optional(),
    apiKey: z.string().optional()
  })
});

const resetSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.RESET),
  payload: z.record(z.never())
});

// Navigation/UI message schemas
const navigateSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.NAVIGATE),
  payload: z.object({
    route: z.string(),
    params: z.record(z.unknown()).optional()
  })
});

const openRouteSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.OPEN_ROUTE),
  payload: z.object({
    route: z.string()
  })
});

const toggleSidebarSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.TOGGLE_SIDEBAR),
  payload: z.object({
    visible: z.boolean()
  })
});

const toggleTerminalSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.TOGGLE_TERMINAL),
  payload: z.object({
    visible: z.boolean()
  })
});

const setThemeSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.SET_THEME),
  payload: z.object({
    theme: z.enum(['light', 'dark'])
  })
});

const setFontSizeSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.SET_FONT_SIZE),
  payload: z.object({
    size: z.number()
  })
});

// Prompt Profile message schemas
const promptProfilesSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.PROMPT_PROFILES),
  payload: z.object({
    profiles: z.array(z.any()) // TODO: Define PromptProfile schema
  })
});

const promptProfileUpdatedSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.PROMPT_PROFILE_UPDATED),
  payload: z.object({
    profile: z.any() // TODO: Define PromptProfile schema
  })
});

// Telemetry message schemas
const telemetryErrorSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.TELEMETRY_ERROR),
  payload: z.object({
    error: z.string(),
    details: z.record(z.unknown()).optional()
  })
});

const telemetryEventSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.TELEMETRY_EVENT),
  payload: z.object({
    event: z.string(),
    properties: z.record(z.unknown()).optional()
  })
});

const telemetryMetricSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.TELEMETRY_METRIC),
  payload: z.object({
    name: z.string(),
    value: z.number(),
    tags: z.record(z.string()).optional()
  })
});

// Error message schema
const apiErrorSchema = apiMessageBaseSchema.extend({
  type: z.literal(ApiMessageType.API_ERROR),
  payload: z.object({
    error: z.string(),
    details: z.unknown().optional()
  })
});

// Union schema for all API messages
const apiMessageSchema = z.discriminatedUnion('type', [
  setConfigurationSchema,
  getConfigurationSchema,
  loadModelsSchema,
  fetchModelsSchema,
  clearModelCacheSchema,
  sendMessageSchema,
  resetSchema,
  navigateSchema,
  openRouteSchema,
  toggleSidebarSchema,
  toggleTerminalSchema,
  setThemeSchema,
  setFontSizeSchema,
  promptProfilesSchema,
  promptProfileUpdatedSchema,
  telemetryErrorSchema,
  telemetryEventSchema,
  telemetryMetricSchema,
  apiErrorSchema
]);

// Type guard functions
export function isApiMessage(message: unknown): message is ApiMessage {
  const result = apiMessageSchema.safeParse(message);
  if (!result.success) {
    logger.debug('Invalid API message:', result.error);
    return false;
  }
  return true;
}

export function isApiMessageOfType<T extends ApiMessageType>(
  message: unknown,
  type: T
): message is ApiMessageInterface<T> {
  if (!isApiMessage(message)) {
    return false;
  }
  return message.type === type;
}

// Specific type guards for each message type
export function isSetConfigurationMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.SET_CONFIGURATION> {
  return isApiMessageOfType(message, ApiMessageType.SET_CONFIGURATION);
}

export function isGetConfigurationMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.GET_CONFIGURATION> {
  return isApiMessageOfType(message, ApiMessageType.GET_CONFIGURATION);
}

export function isLoadModelsMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.LOAD_MODELS> {
  return isApiMessageOfType(message, ApiMessageType.LOAD_MODELS);
}

export function isFetchModelsMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.FETCH_MODELS> {
  return isApiMessageOfType(message, ApiMessageType.FETCH_MODELS);
}

export function isClearModelCacheMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.CLEAR_MODEL_CACHE> {
  return isApiMessageOfType(message, ApiMessageType.CLEAR_MODEL_CACHE);
}

export function isSendMessageMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.SEND_MESSAGE> {
  return isApiMessageOfType(message, ApiMessageType.SEND_MESSAGE);
}

export function isResetMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.RESET> {
  return isApiMessageOfType(message, ApiMessageType.RESET);
}

export function isNavigateMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.NAVIGATE> {
  return isApiMessageOfType(message, ApiMessageType.NAVIGATE);
}

export function isOpenRouteMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.OPEN_ROUTE> {
  return isApiMessageOfType(message, ApiMessageType.OPEN_ROUTE);
}

export function isToggleSidebarMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.TOGGLE_SIDEBAR> {
  return isApiMessageOfType(message, ApiMessageType.TOGGLE_SIDEBAR);
}

export function isToggleTerminalMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.TOGGLE_TERMINAL> {
  return isApiMessageOfType(message, ApiMessageType.TOGGLE_TERMINAL);
}

export function isSetThemeMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.SET_THEME> {
  return isApiMessageOfType(message, ApiMessageType.SET_THEME);
}

export function isSetFontSizeMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.SET_FONT_SIZE> {
  return isApiMessageOfType(message, ApiMessageType.SET_FONT_SIZE);
}

export function isPromptProfilesMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.PROMPT_PROFILES> {
  return isApiMessageOfType(message, ApiMessageType.PROMPT_PROFILES);
}

export function isPromptProfileUpdatedMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.PROMPT_PROFILE_UPDATED> {
  return isApiMessageOfType(message, ApiMessageType.PROMPT_PROFILE_UPDATED);
}

export function isTelemetryErrorMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.TELEMETRY_ERROR> {
  return isApiMessageOfType(message, ApiMessageType.TELEMETRY_ERROR);
}

export function isTelemetryEventMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.TELEMETRY_EVENT> {
  return isApiMessageOfType(message, ApiMessageType.TELEMETRY_EVENT);
}

export function isTelemetryMetricMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.TELEMETRY_METRIC> {
  return isApiMessageOfType(message, ApiMessageType.TELEMETRY_METRIC);
}

export function isApiErrorMessage(message: unknown): message is ApiMessageInterface<ApiMessageType.API_ERROR> {
  return isApiMessageOfType(message, ApiMessageType.API_ERROR);
}

/**
 * Type guard to check if a value is a valid API message type
 */
export function isApiMessageType(value: unknown): value is ApiMessageType {
    if (typeof value !== 'string') {
        return false;
    }

    const validTypes = [
        'api.request',
        'api.response',
        'api.error',
        'api.stream.start',
        'api.stream.data',
        'api.stream.end'
    ];

    return validTypes.includes(value);
}

/**
 * Type guard to check if a value is a valid API message
 */
export function isApiMessage(value: unknown): value is {
    type: ApiMessageType;
    requestId: string;
    timestamp: number;
} {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const msg = value as Record<string, unknown>;

    return (
        isApiMessageType(msg.type) &&
        typeof msg.requestId === 'string' &&
        typeof msg.timestamp === 'number'
    );
} 