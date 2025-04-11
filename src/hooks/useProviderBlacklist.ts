import { useState, useEffect, useCallback } from 'react';
import { useEventBus } from './useEventBus';

/**
 * Interfaccia che definisce lo stato di un provider bloccato
 */
export interface BlockedProvider {
  reason: 'predictive' | 'manual' | 'auto-mitigation';
  blockedAt: number;
  expiresAt: number;
}

/**
 * Tipo che rappresenta la blacklist completa dei provider
 */
export type ProviderBlacklist = Record<string, BlockedProvider>;

/**
 * Hook per la gestione della blacklist dei provider
 * 
 * @example
 * ```tsx
 * const { blacklist, isBlocked, block, unblock } = useProviderBlacklist();
 * 
 * // Blocca un provider per 120 secondi
 * block('provider-1', 'auto-mitigation', 120);
 * 
 * // Verifica se un provider è bloccato
 * if (isBlocked('provider-1')) {
 *   // Provider bloccato
 * }
 * ```
 */
export function useProviderBlacklist() {
  const [blacklist, setBlacklist] = useState<ProviderBlacklist>({});
  const eventBus = useEventBus();

  /**
   * Verifica se un provider è attualmente bloccato
   */
  const isBlocked = useCallback((providerId: string): boolean => {
    const blocked = blacklist[providerId];
    if (!blocked) return false;

    // Se il provider è scaduto, lo rimuoviamo automaticamente
    if (Date.now() > blocked.expiresAt) {
      unblock(providerId);
      return false;
    }

    return true;
  }, [blacklist]);

  /**
   * Blocca un provider per un determinato periodo
   */
  const block = useCallback((
    providerId: string,
    reason: BlockedProvider['reason'],
    ttl: number = 120 // Default: 120 secondi
  ) => {
    const now = Date.now();
    const blockedProvider: BlockedProvider = {
      reason,
      blockedAt: now,
      expiresAt: now + (ttl * 1000)
    };

    setBlacklist(prev => ({
      ...prev,
      [providerId]: blockedProvider
    }));

    // Emetti evento di blacklist
    eventBus.emit('provider:blacklisted', {
      providerId,
      ...blockedProvider
    });
  }, [eventBus]);

  /**
   * Rimuove un provider dalla blacklist
   */
  const unblock = useCallback((providerId: string) => {
    setBlacklist(prev => {
      const { [providerId]: removed, ...rest } = prev;
      return rest;
    });

    // Emetti evento di ripristino
    eventBus.emit('provider:restored', { providerId });
  }, [eventBus]);

  /**
   * Effetto per la pulizia automatica dei provider scaduti
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBlacklist(prev => {
        const updated = { ...prev };
        let changed = false;

        Object.entries(prev).forEach(([providerId, blocked]) => {
          if (now > blocked.expiresAt) {
            delete updated[providerId];
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
    }, 1000); // Controlla ogni secondo

    return () => clearInterval(interval);
  }, []);

  return {
    blacklist,
    isBlocked,
    block,
    unblock
  };
} 