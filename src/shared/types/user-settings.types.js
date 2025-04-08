/**
 * @file user-settings.types.ts
 * @description Definizioni centralizzate dei tipi di impostazioni utente
 * Questo file contiene tutte le interfacce relative alle impostazioni configurabili dall'utente
 */
/**
 * Normalizza le impostazioni di chat fornendo valori predefiniti
 * @param settings Impostazioni di chat parziali
 * @returns Impostazioni di chat complete con valori predefiniti
 */
export function normalizeChatSettings(settings) {
    return {
        // Parametri di generazione del modello
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
        stopSequences: [],
        enableStreaming: true,
        contextWindow: 4000,
        // Parametri di esecuzione
        workingDirectory: '',
        shell: '',
        customInstructions: '',
        planActSeparateModels: false,
        // Impostazioni di visualizzazione UI
        displayMode: 'standard',
        font: 'system-ui',
        fontSize: 14,
        theme: 'system',
        // Funzionalità chat
        autosave: true,
        autosaveInterval: 5,
        maxHistoryMessages: 100,
        enableDefaultPrompts: true,
        enableAutoComplete: true,
        enableSuggestions: true,
        enableMarkdown: true,
        language: 'en',
        enableSyntaxHighlighting: true,
        saveHistory: true,
        maxHistoryItems: 100,
        showAvatars: true,
        enableAutoScroll: true,
        displayTimestamps: true,
        useMarkdown: true,
        ...settings,
    };
}
/**
 * Normalizza le impostazioni di browser fornendo valori predefiniti
 * @param settings Impostazioni di browser parziali
 * @returns Impostazioni di browser complete con valori predefiniti
 */
export function normalizeBrowserSettings(settings) {
    return {
        // Impostazioni generali
        enabled: true,
        browserContextEnabled: true,
        headless: true,
        timeout: 30000,
        // Comportamento browser
        useSandbox: true,
        allowJavaScript: true,
        allowCookies: true,
        allowLocalStorage: true,
        debugMode: false,
        // Acquisizione contenuto
        includeFullPageText: true,
        includeActiveTabOnly: false,
        includeHTMLSnapshot: false,
        includeCodeContext: true,
        useMhtml: false,
        maxUrls: 5,
        maxNavigationDepth: 2,
        // Navigazione
        startUrl: '',
        // Visualizzazione
        viewport: {
            width: 900,
            height: 600,
        },
        width: 900,
        height: 600,
        trackNetworkActivity: true,
        screenshotSettings: {
            format: 'png',
            quality: 90,
            fullPage: true,
        },
        ...settings,
    };
}
/**
 * Normalizza le impostazioni di approvazione automatica fornendo valori predefiniti
 * @param settings Impostazioni di approvazione automatica parziali
 * @returns Impostazioni di approvazione automatica complete con valori predefiniti
 */
export function normalizeAutoApprovalSettings(settings) {
    return {
        enabled: false,
        actions: {
            readFiles: false,
            editFiles: false,
            executeCommands: false,
            useBrowser: false,
            useMcp: false,
        },
        maxRequests: 20,
        enableNotifications: false,
        tools: [],
        threshold: 0.8,
        maxAutoApprovals: 5,
        allowReadOnly: false,
        allowReadWrite: false,
        allowTerminalCommands: false,
        ...settings,
    };
}
//# sourceMappingURL=user-settings.types.js.map