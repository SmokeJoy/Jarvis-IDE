/**
 * @file test-utils.types.ts
 * @description Definizioni per i test
 */

import { LLMProviderHandler, ModelInfo } from './provider.types';
import { LLMEventPayload, ProviderStats } from './fallback.types';

export interface MockLLMProvider extends LLMProviderHandler {
  mockResponses: string[];
  currentResponseIndex: number;
}

export interface MockModelInfo extends ModelInfo {
  mockCapabilities: string[];
}

export interface MockProviderStats extends ProviderStats {
  mockEvents: LLMEventPayload[];
}

export interface TestConfig {
  mockProviders: MockLLMProvider[];
  mockModels: MockModelInfo[];
  mockStats: MockProviderStats[];
  timeout?: number;
  shouldFail?: boolean;
}
