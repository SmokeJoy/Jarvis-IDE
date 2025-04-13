import { LLMEventBus } from './eventBus';

export function simulateProviderFailure(eventBus: LLMEventBus) {
  eventBus.emit('provider:failure', {
    providerId: 'openai',
    reason: 'timeout',
    strategyName: 'AdaptiveFallback',
    newProvider: 'anthropic',
    candidates: [
      { id: 'openai', excluded: true, stats: { latency: 900, successRate: 0.75 } },
      { id: 'anthropic', score: 0.85, stats: { latency: 200, successRate: 0.92 } },
      { id: 'mistral', score: 0.92, stats: { latency: 150, successRate: 0.95 } },
    ],
    conditions: [
      { name: 'FailureRate > 20%', isActive: true },
      { name: 'Latency spike', isActive: false },
    ],
  });
}

export function simulateStrategyChange(eventBus: LLMEventBus) {
  eventBus.emit('strategy:adaptive:change', {
    strategyName: 'RoundRobin',
    selectedProvider: 'mistral',
    reason: 'Manual strategy change',
    candidates: [
      { id: 'openai', score: 0.8, stats: { latency: 300, successRate: 0.85 } },
      { id: 'anthropic', score: 0.75, stats: { latency: 250, successRate: 0.88 } },
      { id: 'mistral', score: 0.92, stats: { latency: 150, successRate: 0.95 } },
    ],
    conditions: [
      { name: 'Manual override', isActive: true },
      { name: 'Performance check', isActive: true },
    ],
  });
}

export function simulateProviderSuccess(eventBus: LLMEventBus) {
  eventBus.emit('provider:success', {
    providerId: 'openai',
    strategyName: 'AdaptiveFallback',
    candidates: [
      { id: 'openai', score: 0.9, stats: { latency: 200, successRate: 0.95 } },
      { id: 'anthropic', score: 0.85, stats: { latency: 200, successRate: 0.92 } },
      { id: 'mistral', score: 0.92, stats: { latency: 150, successRate: 0.95 } },
    ],
    conditions: [
      { name: 'Recovery check', isActive: true },
      { name: 'Performance check', isActive: true },
    ],
  });
}
