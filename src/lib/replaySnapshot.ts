import { AuditEntry } from '../types/audit';
import { eventBus } from './eventBus';

export const replaySnapshot = async (entry: AuditEntry) => {
  try {
    console.log(`[Replay] Inizio replay snapshot ${entry.timestamp}`, {
      strategy: entry.strategyName,
      provider: entry.selectedProvider,
      reason: entry.fallbackReason
    });

    // Simula il fallback del provider originale
    if (entry.fallbackReason) {
      await eventBus.emit('provider:failure', {
        providerId: entry.selectedProvider,
        reason: entry.fallbackReason,
        timestamp: Date.now(),
        __replayed: true
      });
    }

    // Simula il cambio di strategia se necessario
    if (entry.strategyName) {
      await eventBus.emit('strategy:adaptive:change', {
        strategyName: entry.strategyName,
        reason: 'Replay snapshot',
        timestamp: Date.now(),
        __replayed: true
      });
    }

    // Simula la selezione del nuovo provider
    await eventBus.emit('provider:success', {
      providerId: entry.selectedProvider,
      score: entry.providerCandidates.find(p => p.id === entry.selectedProvider)?.score,
      timestamp: Date.now(),
      __replayed: true
    });

    console.log(`[Replay] Snapshot ${entry.timestamp} completato con successo`);
    return true;
  } catch (error) {
    console.error(`[Replay] Errore durante il replay dello snapshot ${entry.timestamp}:`, error);
    return false;
  }
}; 