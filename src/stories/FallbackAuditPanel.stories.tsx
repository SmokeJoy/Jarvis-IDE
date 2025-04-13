import React from 'react';
import { FallbackAuditPanel } from '../components/FallbackAuditPanel';
import { LLMEventBus } from '../mas/core/fallback/LLMEventBus';
import { AdaptiveFallbackStrategy } from '../mas/core/fallback/strategies/AdaptiveFallbackStrategy';
import { PreferredFallbackStrategy } from '../mas/core/fallback/strategies/PreferredFallbackStrategy';
import { RoundRobinFallbackStrategy } from '../mas/core/fallback/strategies/RoundRobinFallbackStrategy';
import {
  failureRateAbove,
  providerFailedRecently,
} from '../mas/core/fallback/strategies/adaptive-conditions';

export default {
  title: 'Fallback/AuditPanel',
  component: FallbackAuditPanel,
  parameters: {
    layout: 'centered',
  },
};

// Mock dei provider
const mockProviders = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'mistral', name: 'Mistral' },
];

// Template base
const Template = (args) => <FallbackAuditPanel {...args} />;

// Storia con strategia adattiva
export const AdaptiveStrategy = Template.bind({});
AdaptiveStrategy.args = {
  eventBus: new LLMEventBus(),
  strategy: new AdaptiveFallbackStrategy([
    {
      name: 'preferred',
      strategy: new PreferredFallbackStrategy('openai'),
      condition: failureRateAbove(20),
    },
    {
      name: 'round-robin',
      strategy: new RoundRobinFallbackStrategy(),
      condition: providerFailedRecently('openai'),
    },
  ]),
  providers: mockProviders,
};

// Storia con strategia preferita
export const PreferredStrategy = Template.bind({});
PreferredStrategy.args = {
  eventBus: new LLMEventBus(),
  strategy: new PreferredFallbackStrategy('openai'),
  providers: mockProviders,
};

// Storia con strategia round-robin
export const RoundRobinStrategy = Template.bind({});
RoundRobinStrategy.args = {
  eventBus: new LLMEventBus(),
  strategy: new RoundRobinFallbackStrategy(),
  providers: mockProviders,
};

// Simula eventi per la demo
const simulateEvents = (eventBus: LLMEventBus) => {
  setInterval(() => {
    eventBus.emit('strategy:adaptive:change', {
      fromStrategy: 'preferred',
      toStrategy: 'round-robin',
      reason: 'Provider failure',
      timestamp: Date.now(),
    });
  }, 5000);

  setInterval(() => {
    eventBus.emit('provider:success', {
      providerId: 'openai',
      responseTime: 150,
      timestamp: Date.now(),
    });
  }, 3000);

  setInterval(() => {
    eventBus.emit('provider:failure', {
      providerId: 'anthropic',
      error: 'Timeout',
      timestamp: Date.now(),
    });
  }, 7000);
};

// Aggiungi la simulazione di eventi alla storia adattiva
AdaptiveStrategy.decorators = [
  (Story) => {
    const eventBus = new LLMEventBus();
    simulateEvents(eventBus);
    return <Story args={{ ...AdaptiveStrategy.args, eventBus }} />;
  },
];
