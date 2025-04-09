/**
 * @file telemetry.types.ts
 * @description Definizione centralizzata delle interfacce per la telemetria
 */

/**
 * Configurazione per la telemetria
 * Supporta sia il formato oggetto che il formato stringa per retrocompatibilità
 */
export type TelemetrySetting = 
  | { enabled: boolean; apiKey?: string }
  | "enabled" 
  | "disabled" 
  | "ask";

// Funzione di utility per normalizzare le impostazioni di telemetria
export function normalizeTelemetrySetting(setting: TelemetrySetting | undefined): { enabled: boolean; apiKey?: string } {
  if (!setting) {
    return { enabled: false };
  }
  
  if (typeof setting === 'string') {
    return { 
      enabled: setting === 'enabled',
      // 'ask' viene considerato come disabilitato finché l'utente non dà il consenso
      apiKey: undefined
    };
  }
  
  return setting;
} 