import type { FallbackStrategy } from '../../../src/mas/core/fallback/strategies/FallbackStrategy';

export const createMockStrategy = (): FallbackStrategy => {
  let activeStrategy = 'latency-based';
  let activeProvider = 'openai';
  const stats = new Map();

  return {
    getActive: () => activeStrategy,
    setActive: (strategy: string) => {
      activeStrategy = strategy;
    },
    getCurrentProvider: () => activeProvider,
    setCurrentProvider: (provider: string) => {
      activeProvider = provider;
    },
    getStats: () => stats,
    updateStats: (provider: string, data: any) => {
      stats.set(provider, {
        ...stats.get(provider),
        ...data
      });
    },
    reset: () => {
      activeStrategy = 'latency-based';
      activeProvider = 'openai';
      stats.clear();
    }
  };
}; 