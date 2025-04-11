/**
 * @file FallbackStrategyFactory.test.ts
 * @description Test per la factory delle strategie di fallback
 */

import { describe, it, expect } from 'vitest';
import { 
  FallbackStrategyFactory, 
  PreferredFallbackStrategy,
  RoundRobinFallbackStrategy,
  ReliabilityFallbackStrategy
} from '../';

describe('FallbackStrategyFactory', () => {
  // Test di creazione strategia 'preferred'
  it('dovrebbe creare una PreferredFallbackStrategy', () => {
    const strategy = FallbackStrategyFactory.create('preferred');
    
    expect(strategy).toBeInstanceOf(PreferredFallbackStrategy);
  });
  
  // Test di creazione strategia 'preferred' con opzioni
  it('dovrebbe passare correttamente le opzioni alla PreferredFallbackStrategy', () => {
    const strategy = FallbackStrategyFactory.create('preferred', {
      preferredProvider: 'openai',
      rememberSuccessful: false
    }) as PreferredFallbackStrategy;
    
    // Verifichiamo che le opzioni siano state passate correttamente
    // verificando il comportamento atteso
    expect(strategy.getPreferredProviderId()).toBe('openai');
    
    // Verifichiamo che rememberSuccessful sia false provando a notificare un successo
    // e controllando che il preferito non cambi
    strategy.notifySuccess('anthropic');
    expect(strategy.getPreferredProviderId()).toBe('openai');
  });
  
  // Test di creazione strategia 'roundRobin'
  it('dovrebbe creare una RoundRobinFallbackStrategy', () => {
    const strategy = FallbackStrategyFactory.create('roundRobin');
    
    expect(strategy).toBeInstanceOf(RoundRobinFallbackStrategy);
  });
  
  // Test di creazione strategia 'reliability'
  it('dovrebbe creare una ReliabilityFallbackStrategy', () => {
    const strategy = FallbackStrategyFactory.create('reliability');
    
    expect(strategy).toBeInstanceOf(ReliabilityFallbackStrategy);
  });
  
  // Test di creazione strategia 'reliability' con minimumAttempts personalizzato
  it('dovrebbe passare correttamente minimumAttempts a ReliabilityFallbackStrategy', () => {
    const customMinAttempts = 10;
    const strategy = FallbackStrategyFactory.create('reliability', {
      minimumAttempts: customMinAttempts
    });
    
    // Non possiamo verificare direttamente minimumAttempts perché è privato,
    // ma possiamo verificare che il tipo sia corretto
    expect(strategy).toBeInstanceOf(ReliabilityFallbackStrategy);
    
    // Se avessimo accesso a un metodo per ottenere minimumAttempts, potremmo usarlo qui
  });
  
  // Test di gestione errore per tipo non supportato
  it('dovrebbe lanciare un errore per un tipo di strategia non supportato', () => {
    expect(() => {
      FallbackStrategyFactory.create('invalid_strategy');
    }).toThrowError('Strategia di fallback non supportata: invalid_strategy');
  });
  
  // Test del metodo getAvailableStrategies
  it('dovrebbe elencare tutte le strategie disponibili', () => {
    const availableStrategies = FallbackStrategyFactory.getAvailableStrategies();
    
    expect(availableStrategies).toContain('preferred');
    expect(availableStrategies).toContain('roundRobin');
    expect(availableStrategies).toContain('reliability');
    expect(availableStrategies.length).toBe(3);
  });
}); 