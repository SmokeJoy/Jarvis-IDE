import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FallbackChartPanel } from '../components/FallbackChartPanel';
import type { FallbackAudit } from '../types/fallback';

// Dati mock iniziali
const initialMockAudits: FallbackAudit[] = [
  {
    timestamp: Date.now() - 30000,
    provider: 'openai',
    success: true,
    latency: 450,
    cost: 0.02,
    strategy: 'adaptive',
    condition: 'latency'
  },
  {
    timestamp: Date.now() - 25000,
    provider: 'anthropic',
    success: true,
    latency: 380,
    cost: 0.015,
    strategy: 'adaptive',
    condition: 'cost'
  },
  {
    timestamp: Date.now() - 20000,
    provider: 'mistral',
    success: false,
    latency: 520,
    cost: 0.01,
    strategy: 'adaptive',
    condition: 'latency'
  },
  {
    timestamp: Date.now() - 15000,
    provider: 'openai',
    success: true,
    latency: 420,
    cost: 0.02,
    strategy: 'adaptive',
    condition: 'latency'
  },
  {
    timestamp: Date.now() - 10000,
    provider: 'anthropic',
    success: true,
    latency: 400,
    cost: 0.015,
    strategy: 'adaptive',
    condition: 'cost'
  },
  {
    timestamp: Date.now() - 5000,
    provider: 'mistral',
    success: true,
    latency: 480,
    cost: 0.01,
    strategy: 'adaptive',
    condition: 'latency'
  }
];

const meta: Meta<typeof FallbackChartPanel> = {
  title: 'Components/FallbackChartPanel',
  component: FallbackChartPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FallbackChartPanel>;

// Funzione per generare un nuovo audit mock
const generateMockAudit = (): FallbackAudit => {
  const providers = ['openai', 'anthropic', 'mistral'];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const success = Math.random() > 0.2; // 80% di successo
  const latency = Math.floor(300 + Math.random() * 300); // 300-600ms
  const cost = 0.01 + Math.random() * 0.02; // 0.01-0.03

  return {
    timestamp: Date.now(),
    provider,
    success,
    latency,
    cost,
    strategy: 'adaptive',
    condition: Math.random() > 0.5 ? 'latency' : 'cost'
  };
};

// Template con aggiornamento dinamico
const TemplateWithUpdates = () => {
  const [audits, setAudits] = useState<FallbackAudit[]>(initialMockAudits);

  useEffect(() => {
    const interval = setInterval(() => {
      setAudits(prev => {
        const newAudit = generateMockAudit();
        return [...prev, newAudit].slice(-20); // Mantieni solo gli ultimi 20 audit
      });
    }, 5000); // Aggiorna ogni 5 secondi

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[800px]">
      <FallbackChartPanel audits={audits} />
    </div>
  );
};

export const Default: Story = {
  args: {
    audits: initialMockAudits,
  },
  render: (args) => (
    <div className="w-[800px]">
      <FallbackChartPanel {...args} />
    </div>
  ),
};

export const WithLiveUpdates: Story = {
  render: TemplateWithUpdates,
};

// Storia con molti dati
export const WithManyDataPoints: Story = {
  args: {
    audits: Array.from({ length: 50 }, (_, i) => ({
      timestamp: Date.now() - (i * 10000),
      provider: ['openai', 'anthropic', 'mistral'][i % 3],
      success: Math.random() > 0.2,
      latency: Math.floor(300 + Math.random() * 300),
      cost: 0.01 + Math.random() * 0.02,
      strategy: 'adaptive',
      condition: Math.random() > 0.5 ? 'latency' : 'cost'
    })),
  },
  render: (args) => (
    <div className="w-[800px]">
      <FallbackChartPanel {...args} />
    </div>
  ),
}; 