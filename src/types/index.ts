/**
 * @file index.ts
 * @description Entry point per tutti i tipi condivisi
 */

// Provider types
export * from './provider.types';

// API types
export * from './api.types';

// Fallback types
export * from './fallback.types';

// Webview types
export * from './webview.types';

// Settings types
export * from './settings.types';

// Metrics types
export * from './metrics.types';

// Telemetry types
export * from './telemetry.types';

// MAS types
export * from './mas.types';

// Test utils types
export * from './test-utils.types';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  provider?: string;
}

export interface LLMProviderHandler {
  id: string;
  invoke: (...args: any[]) => Promise<any>;
  supportsStreaming?: boolean;
}
