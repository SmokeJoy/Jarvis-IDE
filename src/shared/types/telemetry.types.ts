/**
 * @file telemetry.types.ts
 * @description Definizione centralizzata delle interfacce per la telemetria
 */

/**
 * Stato della telemetria come stringa
 */
export type TelemetryState = 'enabled' | 'disabled' | 'ask';

/**
 * Configurazione della telemetria come oggetto
 */
export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly apiKey?: string;
}

/**
 * Configurazione per la telemetria
 * Supporta sia il formato oggetto che il formato stringa per retrocompatibilità
 */
export type TelemetrySetting = TelemetryConfig | TelemetryState;

/**
 * Funzione di utility per normalizzare le impostazioni di telemetria
 * @param setting - Impostazione di telemetria da normalizzare
 * @returns Configurazione normalizzata della telemetria
 */
export function normalizeTelemetrySetting(setting: TelemetrySetting | undefined): TelemetryConfig {
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

  return {
    enabled: setting.enabled,
    apiKey: setting.apiKey,
  };
}
