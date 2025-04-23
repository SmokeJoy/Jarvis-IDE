/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Error categories
 */
export enum ErrorCategory {
  // API errors
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  
  // Validation errors
  VALIDATION_ERROR = 'validation_error',
  SCHEMA_ERROR = 'schema_error',
  TYPE_ERROR = 'type_error',
  
  // Runtime errors
  RUNTIME_ERROR = 'runtime_error',
  MEMORY_ERROR = 'memory_error',
  RESOURCE_ERROR = 'resource_error',
  
  // Extension errors
  EXTENSION_ERROR = 'extension_error',
  WEBVIEW_ERROR = 'webview_error',
  COMMAND_ERROR = 'command_error',
  
  // Provider errors
  PROVIDER_ERROR = 'provider_error',
  MODEL_ERROR = 'model_error',
  TOKEN_ERROR = 'token_error'
}

/**
 * Base error interface
 */
export interface ExtensionError {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code?: string;
  timestamp: number;
}

/**
 * API error interface
 */
export interface ApiError extends ExtensionError {
  category: ErrorCategory.API_ERROR | ErrorCategory.NETWORK_ERROR | ErrorCategory.TIMEOUT_ERROR;
  details?: {
    endpoint?: string;
    method?: string;
    status?: number;
    response?: unknown;
  };
}

/**
 * Validation error interface
 */
export interface ValidationError extends ExtensionError {
  category: ErrorCategory.VALIDATION_ERROR | ErrorCategory.SCHEMA_ERROR | ErrorCategory.TYPE_ERROR;
  details?: {
    field?: string;
    value?: unknown;
    constraint?: string;
    expected?: string;
  };
}

/**
 * Runtime error interface
 */
export interface RuntimeError extends ExtensionError {
  category: ErrorCategory.RUNTIME_ERROR | ErrorCategory.MEMORY_ERROR | ErrorCategory.RESOURCE_ERROR;
  details?: {
    stack?: string;
    cause?: string;
    resource?: string;
    limit?: number;
  };
}

/**
 * Extension error interface
 */
export interface ExtensionSystemError extends ExtensionError {
  category: ErrorCategory.EXTENSION_ERROR | ErrorCategory.WEBVIEW_ERROR | ErrorCategory.COMMAND_ERROR;
  details?: {
    component?: string;
    command?: string;
    context?: Record<string, unknown>;
  };
}

/**
 * Provider error interface
 */
export interface ProviderError extends ExtensionError {
  category: ErrorCategory.PROVIDER_ERROR | ErrorCategory.MODEL_ERROR | ErrorCategory.TOKEN_ERROR;
  details?: {
    provider?: string;
    model?: string;
    tokens?: number;
    limit?: number;
  };
}

/**
 * Union type of all error types
 */
export type ExtensionErrorUnion =
  | ApiError
  | ValidationError
  | RuntimeError
  | ExtensionSystemError
  | ProviderError;

/**
 * Error handler type
 */
export type ErrorHandler = (error: ExtensionErrorUnion) => void;

/**
 * Error reporter interface
 */
export interface ErrorReporter {
  report: ErrorHandler;
  severity: ErrorSeverity;
  categories: ErrorCategory[];
} 