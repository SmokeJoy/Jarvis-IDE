/**
 * Interfaccia per i modelli configurati nell'app
 */
export interface ConfigModelInfo {
    label: string;        // Nome visualizzato del modello
    value: string;        // ID del modello
    provider: string;     // Provider del modello (local, openrouter, google, ecc.)
    coder: boolean;       // Flag che indica se il modello è ottimizzato per il codice
    description?: string; // Descrizione opzionale del modello
    contextLength?: number; // Lunghezza massima del contesto in token
    isDefault?: boolean;  // Indica se è il modello predefinito
    tags?: string[];      // Tag aggiuntivi (es. "vision", "premium", ecc.)
}

/**
 * Estende l'interfaccia ExtensionState per includere i modelli disponibili
 */
export interface ModelExtensionState {
    availableModels?: ConfigModelInfo[];
    selectedModel?: string;
} 