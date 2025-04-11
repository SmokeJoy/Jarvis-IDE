/**
 * @file LLMEventBus.test.ts
 * @description Test per il sistema di event bus per provider LLM
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMEventBus, LLMEventName, LLMEventPayload } from '../LLMEventBus';

describe('LLMEventBus', () => {
  let eventBus: LLMEventBus;
  
  beforeEach(() => {
    // Crea una nuova istanza dell'event bus per ogni test
    eventBus = new LLMEventBus();
  });
  
  // Test di inizializzazione di base
  it('dovrebbe inizializzare correttamente', () => {
    expect(eventBus).toBeDefined();
    expect(eventBus.listenerCount('provider:success')).toBe(0);
  });
  
  // Test di registrazione di un listener
  it('dovrebbe permettere di registrare un listener', () => {
    const listener = vi.fn();
    eventBus.on('provider:success', listener);
    
    expect(eventBus.listenerCount('provider:success')).toBe(1);
  });
  
  // Test di rimozione di un listener
  it('dovrebbe permettere di rimuovere un listener', () => {
    const listener = vi.fn();
    eventBus.on('provider:success', listener);
    
    expect(eventBus.listenerCount('provider:success')).toBe(1);
    
    eventBus.off('provider:success', listener);
    expect(eventBus.listenerCount('provider:success')).toBe(0);
  });
  
  // Test di emissione di un evento
  it('dovrebbe emettere eventi e chiamare i listener registrati', () => {
    const listener = vi.fn();
    eventBus.on('provider:success', listener);
    
    const payload: Omit<LLMEventPayload, 'timestamp'> = {
      providerId: 'openai'
    };
    
    eventBus.emit('provider:success', payload);
    
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      providerId: 'openai',
      timestamp: expect.any(Number)
    }));
  });
  
  // Test di emissione di un evento con più listener
  it('dovrebbe notificare tutti i listener registrati per un evento', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    eventBus.on('provider:success', listener1);
    eventBus.on('provider:success', listener2);
    
    eventBus.emit('provider:success', { providerId: 'anthropic' });
    
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });
  
  // Test per verificare che non vengano chiamati listener di eventi diversi
  it('non dovrebbe notificare listener di altri eventi', () => {
    const successListener = vi.fn();
    const failureListener = vi.fn();
    
    eventBus.on('provider:success', successListener);
    eventBus.on('provider:failure', failureListener);
    
    eventBus.emit('provider:success', { providerId: 'openai' });
    
    expect(successListener).toHaveBeenCalledTimes(1);
    expect(failureListener).not.toHaveBeenCalled();
  });
  
  // Test del method chaining per on, off
  it('dovrebbe supportare il method chaining', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    // Method chaining per le registrazioni
    eventBus
      .on('provider:success', listener1)
      .on('provider:failure', listener2);
    
    expect(eventBus.listenerCount('provider:success')).toBe(1);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
    
    // Method chaining per le rimozioni
    eventBus
      .off('provider:success', listener1)
      .off('provider:failure', listener2);
    
    expect(eventBus.listenerCount('provider:success')).toBe(0);
    expect(eventBus.listenerCount('provider:failure')).toBe(0);
  });
  
  // Test di removeAllListeners per un evento specifico
  it('dovrebbe rimuovere tutti i listener per un evento specifico', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    eventBus.on('provider:success', listener1);
    eventBus.on('provider:success', listener2);
    eventBus.on('provider:failure', vi.fn());
    
    expect(eventBus.listenerCount('provider:success')).toBe(2);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
    
    eventBus.removeAllListeners('provider:success');
    
    expect(eventBus.listenerCount('provider:success')).toBe(0);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
  });
  
  // Test di removeAllListeners senza specificare l'evento
  it('dovrebbe rimuovere tutti i listener quando non viene specificato l\'evento', () => {
    eventBus.on('provider:success', vi.fn());
    eventBus.on('provider:failure', vi.fn());
    eventBus.on('provider:fallback', vi.fn());
    
    expect(eventBus.listenerCount('provider:success')).toBe(1);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
    expect(eventBus.listenerCount('provider:fallback')).toBe(1);
    
    eventBus.removeAllListeners();
    
    expect(eventBus.listenerCount('provider:success')).toBe(0);
    expect(eventBus.listenerCount('provider:failure')).toBe(0);
    expect(eventBus.listenerCount('provider:fallback')).toBe(0);
  });
  
  // Test per verificare che un listener in errore non blocchi gli altri
  it('dovrebbe gestire gli errori nei listener e continuare con gli altri', () => {
    const errorListener = vi.fn().mockImplementation(() => {
      throw new Error('Errore simulato nel listener');
    });
    
    const successListener = vi.fn();
    
    // Mock della console.error per evitare output di errore nei test
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    try {
      eventBus.on('provider:success', errorListener);
      eventBus.on('provider:success', successListener);
      
      eventBus.emit('provider:success', { providerId: 'openai' });
      
      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(successListener).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    } finally {
      // Ripristina console.error originale
      console.error = originalConsoleError;
    }
  });
  
  // Test per verificare che il timestamp venga aggiunto automaticamente
  it('dovrebbe aggiungere automaticamente il timestamp se non presente', () => {
    const listener = vi.fn();
    eventBus.on('provider:success', listener);
    
    const before = Date.now();
    eventBus.emit('provider:success', { providerId: 'openai' });
    const after = Date.now();
    
    expect(listener).toHaveBeenCalledTimes(1);
    
    const payload = listener.mock.calls[0][0];
    expect(payload).toHaveProperty('timestamp');
    expect(payload.timestamp).toBeGreaterThanOrEqual(before);
    expect(payload.timestamp).toBeLessThanOrEqual(after);
  });
  
  // Test per verificare che non succeda nulla se non ci sono listener
  it('non dovrebbe fare nulla quando non ci sono listener registrati', () => {
    // Non esplicitamente testabile, ma verifichiamo che non ci siano errori
    expect(() => {
      eventBus.emit('provider:success', { providerId: 'openai' });
    }).not.toThrow();
  });
  
  // Test per l'evento provider:cooldown
  it('dovrebbe emettere e gestire correttamente eventi di cooldown', () => {
    const cooldownListener = vi.fn();
    eventBus.on('provider:cooldown', cooldownListener);
    
    const cooldownPayload = {
      providerId: 'openai',
      cooldownUntil: Date.now() + 60000 // 1 minuto di cooldown
    };
    
    eventBus.emit('provider:cooldown', cooldownPayload);
    
    expect(cooldownListener).toHaveBeenCalledTimes(1);
    expect(cooldownListener).toHaveBeenCalledWith(expect.objectContaining({
      providerId: 'openai',
      cooldownUntil: expect.any(Number),
      timestamp: expect.any(Number)
    }));
  });
  
  // Test di rimozione di tutti i listener
  it('dovrebbe permettere di rimuovere tutti i listener', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    eventBus.on('provider:success', listener1);
    eventBus.on('provider:failure', listener2);
    
    expect(eventBus.listenerCount('provider:success')).toBe(1);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
    
    eventBus.removeAllListeners();
    
    expect(eventBus.listenerCount('provider:success')).toBe(0);
    expect(eventBus.listenerCount('provider:failure')).toBe(0);
  });
  
  // Test di rimozione di tutti i listener per un evento specifico
  it('dovrebbe permettere di rimuovere tutti i listener per un evento specifico', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const listener3 = vi.fn();
    
    eventBus.on('provider:success', listener1);
    eventBus.on('provider:success', listener2);
    eventBus.on('provider:failure', listener3);
    
    expect(eventBus.listenerCount('provider:success')).toBe(2);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
    
    eventBus.removeAllListeners('provider:success');
    
    expect(eventBus.listenerCount('provider:success')).toBe(0);
    expect(eventBus.listenerCount('provider:failure')).toBe(1);
  });
}); 