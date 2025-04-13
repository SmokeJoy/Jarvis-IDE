import { FallbackStrategy } from '../../../src/mas/core/fallback/strategies/FallbackStrategy';
import { LLMProviderHandler } from '../../../src/types/llm-provider.types';

export const createMockStrategy = (): FallbackStrategy => {
  let activeStrategy = 'default';

  return {
    name: 'mock-strategy',
    description: 'A mock strategy for testing',
    isEnabled: true,
    providers: new Map<string, LLMProviderHandler>(),
    stats: new Map(),
    conditions: [],
    history: [],

    initialize: async () => {
      // No-op
    },

    dispose: () => {
      // No-op
    },

    selectProvider: async () => {
      return null;
    },

    updateStats: () => {
      // No-op
    },

    reset: () => {
      // No-op
    },

    getActive: () => activeStrategy,

    setActive: async (strategy: string) => {
      activeStrategy = strategy;
    },

    validate: () => true,

    getConditions: () => [],

    getHistory: () => [],

    getStats: () => new Map(),

    getProviders: () => new Map(),

    isEnabled: true,

    enable: async () => {
      // No-op
    },

    disable: async () => {
      // No-op
    }
  };
}; 