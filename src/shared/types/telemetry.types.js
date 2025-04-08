/**
 * @file telemetry.types.ts
 * @description Definizione centralizzata delle interfacce per la telemetria
 */
// Funzione di utility per normalizzare le impostazioni di telemetria
export function normalizeTelemetrySetting(setting) {
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
//# sourceMappingURL=telemetry.types.js.map