/**
 * @file provider-registry.ts
 * @description Mock del registry dei provider LLM per i test
 */

import { vi } from 'vitest';

// Tipi di base
export type LLMProviderId = string;

export interface LLMRequestOptions {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  options?: Record<string, any>;
}

export interface LLMProviderHandler {
  readonly name: string;
  readonly description: string;
  readonly config: Record<string, any>;
  isAvailable: boolean;
  
  call: (params: LLMRequestOptions) => Promise<string>;
  getAvailableModels: () => Promise<string[]>;
  validateRequestOptions: (params: LLMRequestOptions) => boolean;
  updateConfig: (config: Record<string, any>) => void;
}

// Registry di provider mock
class MockProviderRegistry {
  private providers = new Map<LLMProviderId, LLMProviderHandler>();
  private defaultProviderId: LLMProviderId | null = null;

  registerProvider(id: LLMProviderId, handler: LLMProviderHandler, setDefault: boolean = false): boolean {
    this.providers.set(id, handler);
    if (setDefault || this.defaultProviderId === null) {
      this.defaultProviderId = id;
    }
    return true;
  }

  unregisterProvider(id: LLMProviderId): boolean {
    const removed = this.providers.delete(id);
    if (removed && this.defaultProviderId === id) {
      this.defaultProviderId = this.providers.size > 0 
        ? Array.from(this.providers.keys())[0] 
        : null;
    }
    return removed;
  }

  hasProvider(id: LLMProviderId): boolean {
    return this.providers.has(id);
  }

  getProvider(id: LLMProviderId): LLMProviderHandler {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} non trovato`);
    }
    return provider;
  }

  getDefaultProvider(): LLMProviderHandler {
    if (!this.defaultProviderId) {
      throw new Error('Nessun provider predefinito configurato');
    }
    return this.getProvider(this.defaultProviderId);
  }

  setDefaultProvider(id: LLMProviderId): boolean {
    if (!this.providers.has(id)) {
      return false;
    }
    this.defaultProviderId = id;
    return true;
  }

  getDefaultProviderId(): LLMProviderId | null {
    return this.defaultProviderId;
  }

  getAllProviders(): Map<LLMProviderId, LLMProviderHandler> {
    return new Map(this.providers);
  }

  getProviderIds(): LLMProviderId[] {
    return Array.from(this.providers.keys());
  }

  getAvailableProviders(): Map<LLMProviderId, LLMProviderHandler> {
    const available = new Map<LLMProviderId, LLMProviderHandler>();
    this.providers.forEach((provider, id) => {
      if (provider.isAvailable) {
        available.set(id, provider);
      }
    });
    return available;
  }

  reset(): void {
    this.providers.clear();
    this.defaultProviderId = null;
  }
}

// Istanza singleton per i mock
export const ProviderRegistry = new MockProviderRegistry();

// Funzioni di utility
export function registerProvider(
  id: LLMProviderId, 
  handler: LLMProviderHandler, 
  setDefault: boolean = false
): boolean {
  return ProviderRegistry.registerProvider(id, handler, setDefault);
}

export function unregisterProvider(id: LLMProviderId): boolean {
  return ProviderRegistry.unregisterProvider(id);
}

export function hasProvider(id: LLMProviderId): boolean {
  return ProviderRegistry.hasProvider(id);
}

export function getProvider(id: LLMProviderId): LLMProviderHandler {
  return ProviderRegistry.getProvider(id);
}

export function getDefaultProvider(): LLMProviderHandler {
  return ProviderRegistry.getDefaultProvider();
}

export function setDefaultProvider(id: LLMProviderId): boolean {
  return ProviderRegistry.setDefaultProvider(id);
} 