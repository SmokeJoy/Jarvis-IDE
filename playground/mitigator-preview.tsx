// playground/mitigator-preview.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MitigatorOverlay } from '../src/mitigator';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MitigatorOverlay
    selectedProvider="openai"
    excludedProviders={['anthropic']}
    strategy="adaptive_fallback"
    timestamp={new Date()}
    details="Trigger fallback dopo latenza elevata"
    type="provider_change"
    stats={{
      latency: 1400,
      successRate: 0.72
    }}
  />);
} 