/**
 * @file TelemetrySetting.ts
 * @description Tipi e funzioni per le impostazioni di telemetria
 */

import { TelemetrySetting } from './types/telemetry.types';

// Ri-esporta il tipo per retrocompatibilità
export type { TelemetrySetting };

/**
 * Normalizza le impostazioni di telemetria
 * @param setting Le impostazioni da normalizzare
 * @returns Le impostazioni normalizzate
 */
export function normalizeTelemetrySetting(setting?: TelemetrySetting | undefined): {
  enabled: boolean;
  apiKey?: string;
} {
  if (!setting) {
    return { enabled: false };
  }

  if (typeof setting === 'string') {
    return {
      enabled: setting === 'enabled',
      // 'ask' viene considerato come disabilitato finché l'utente non dà il consenso
      apiKey: undefined,
    };
  }

  // Se è un oggetto, lo restituiamo così com'è
  return setting;
}
