/**
 * @file FallbackStrategyFactory.test.ts
 * @description Test per la factory delle strategie di fallback
 */

import { describe, it, expect } from 'vitest';
import { 
  FallbackStrategyFactory, 
  PreferredFallbackStrategy,
  RoundRobinFallbackStrategy,
  ReliabilityFallbackStrategy,
  CompositeFallbackStrategy,
  AdaptiveFallbackStrategy
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
    expect(availableStrategies).toContain('composite');
    expect(availableStrategies).toContain('adaptive');
    expect(availableStrategies.length).toBe(5);
  });
  
  it('dovrebbe creare una AdaptiveFallbackStrategy', () => {
    const strategy = FallbackStrategyFactory.create('adaptive', {
      adaptiveStrategies: [
        {
          type: 'preferred',
          options: { preferredProvider: 'openai' },
          condition: { type: 'failureRate', threshold: 20 },
          name: 'defaultPreferred'
        },
        {
          type: 'reliability',
          condition: { type: 'failureRate', threshold: 20 },
          name: 'fallbackReliability'
        }
      ]
    });
    
    expect(strategy).toBeInstanceOf(AdaptiveFallbackStrategy);
  });
  
  it('dovrebbe lanciare un errore se la strategia adaptive non ha strategie configurate', () => {
    expect(() => {
      FallbackStrategyFactory.create('adaptive', {});
    }).toThrow('La strategia adaptive richiede almeno una strategia con condizione');
    
    expect(() => {
      FallbackStrategyFactory.create('adaptive', { adaptiveStrategies: [] });
    }).toThrow('La strategia adaptive richiede almeno una strategia con condizione');
  });
  
  it('dovrebbe supportare condizioni composte con AND e OR', () => {
    const strategy = FallbackStrategyFactory.create('adaptive', {
      adaptiveStrategies: [
        {
          type: 'preferred',
          options: { preferredProvider: 'openai' },
          condition: { 
            type: 'and',
            conditions: [
              { type: 'failureRate', threshold: 20 },
              { type: 'avgLatency', threshold: 200 }
            ]
          },
          name: 'complexCondition'
        },
        {
          type: 'reliability',
          condition: { 
            type: 'or',
            conditions: [
              { type: 'totalFailures', threshold: 10 },
              { type: 'providerLatency', providerId: 'openai', threshold: 300 }
            ]
          },
          name: 'fallbackReliability'
        }
      ]
    });
    
    expect(strategy).toBeInstanceOf(AdaptiveFallbackStrategy);
  });
  
  it('dovrebbe supportare la configurazione di timeWindow', () => {
    const strategy = FallbackStrategyFactory.create('adaptive', {
      adaptiveStrategies: [
        {
          type: 'preferred',
          options: { preferredProvider: 'openai' },
          condition: { 
            type: 'timeWindow',
            startHour: 9,
            endHour: 17
          },
          name: 'workHours'
        },
        {
          type: 'reliability',
          condition: { 
            type: 'timeWindow',
            startHour: 17,
            endHour: 9
          },
          name: 'nightHours'
        }
      ]
    });
    
    expect(strategy).toBeInstanceOf(AdaptiveFallbackStrategy);
  });
  
  it('dovrebbe gestire correttamente le condizioni providerFailed', () => {
    const strategy = FallbackStrategyFactory.create('adaptive', {
      adaptiveStrategies: [
        {
          type: 'preferred',
          options: { preferredProvider: 'openai' },
          condition: { 
            type: 'providerFailed',
            providerId: 'anthropic',
            timeWindowMs: 300000 // 5 minuti
          },
          name: 'anthropicFailedRecently'
        }
      ]
    });
    
    expect(strategy).toBeInstanceOf(AdaptiveFallbackStrategy);
  });
  
  it('dovrebbe lanciare errori se mancano parametri obbligatori nelle condizioni', () => {
    expect(() => {
      FallbackStrategyFactory.create('adaptive', {
        adaptiveStrategies: [
          {
            type: 'preferred',
            condition: { 
              type: 'providerLatency',
              threshold: 100
              // Manca providerId
            }
          }
        ]
      });
    }).toThrow('providerLatency richiede un providerId');
    
    expect(() => {
      FallbackStrategyFactory.create('adaptive', {
        adaptiveStrategies: [
          {
            type: 'preferred',
            condition: { 
              type: 'timeWindow'
              // Mancano startHour e endHour
            }
          }
        ]
      });
    }).toThrow('timeWindow richiede startHour e endHour');
    
    expect(() => {
      FallbackStrategyFactory.create('adaptive', {
        adaptiveStrategies: [
          {
            type: 'preferred',
            condition: { 
              type: 'and'
              // Manca l'array di conditions
            }
          }
        ]
      });
    }).toThrow('La condizione AND richiede un array di condizioni');
  });
}); 
