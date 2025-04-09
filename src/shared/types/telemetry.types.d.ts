/**
 * @file telemetry.types.ts
 * @description Definizione centralizzata delle interfacce per la telemetria
 */
/**
 * Configurazione per la telemetria
 * Supporta sia il formato oggetto che il formato stringa per retrocompatibilità
 */
export type TelemetrySetting = {
    enabled: boolean;
    apiKey?: string;
} | "enabled" | "disabled" | "ask";
export declare function normalizeTelemetrySetting(setting: TelemetrySetting | undefined): {
    enabled: boolean;
    apiKey?: string;
};
//# sourceMappingURL=telemetry.types.d.ts.map