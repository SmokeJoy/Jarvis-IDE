import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types";
import { getAllMemory, persistMemoryToDisk } from "./contextInjectHandler";
/**
 * Normalizza un tag (lowercase, rimuove spazi non necessari, ecc.)
 */
function normalizeTag(tag) {
    if (!tag)
        return '';
    // Rimuove spazi all'inizio e alla fine
    let normalized = tag.trim();
    // Converti in lowercase per evitare duplicati case-insensitive
    normalized = normalized.toLowerCase();
    // Sostituisci spazi multipli con un singolo trattino
    normalized = normalized.replace(/\s+/g, '-');
    // Rimuovi caratteri non validi (mantenendo solo alfanumerici, trattini e underscores)
    normalized = normalized.replace(/[^a-z0-9\-_]/g, '');
    return normalized;
}
/**
 * Normalizza un array di tag e rimuove i duplicati
 */
function normalizeAndDeduplicateTags(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return [];
    }
    // Normalizza tutti i tag
    const normalizedTags = tags.map(tag => normalizeTag(tag));
    // Rimuovi tag vuoti
    const filteredTags = normalizedTags.filter(tag => tag.length > 0);
    // Rimuovi duplicati
    const uniqueTags = [...new Set(filteredTags)];
    // Limita a un massimo di 10 tag
    return uniqueTags.slice(0, 10);
}
/**
 * Cerca un contesto specifico per ID in tutti gli scope o in uno scope specifico
 * @returns Il contesto trovato e le informazioni per identificarlo (scope, indice), o null se non trovato
 */
function findContextById(id, specificScope) {
    if (specificScope) {
        // Cerca in uno scope specifico
        const allMemory = getAllMemory();
        const items = allMemory[specificScope] || [];
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            return {
                item: items[index],
                scope: specificScope,
                index
            };
        }
        return null;
    }
    else {
        // Cerca in tutti gli scope
        const allMemory = getAllMemory();
        for (const scope in allMemory) {
            const items = allMemory[scope] || [];
            const index = items.findIndex(item => item.id === id);
            if (index !== -1) {
                return {
                    item: items[index],
                    scope,
                    index
                };
            }
        }
        return null;
    }
}
/**
 * Aggiunge tag a un contesto specifico
 * @returns Oggetto con informazioni sul risultato dell'operazione
 */
function addTagsToContext(id, tags, replace = false) {
    // Trova il contesto
    const contextInfo = findContextById(id);
    if (!contextInfo) {
        return {
            success: false,
            error: `Nessun contesto trovato con ID '${id}'`
        };
    }
    const { item, scope } = contextInfo;
    // Normalizza i nuovi tag
    const normalizedNewTags = normalizeAndDeduplicateTags(tags);
    if (normalizedNewTags.length === 0) {
        return {
            success: false,
            error: 'Nessun tag valido fornito'
        };
    }
    // Inizializza l'array tags se non esiste
    if (!item.tags) {
        item.tags = [];
    }
    let allTags;
    let addedTags;
    if (replace) {
        // Sostituisci completamente i tag
        addedTags = [...normalizedNewTags];
        allTags = [...normalizedNewTags];
        item.tags = allTags;
    }
    else {
        // Aggiungi solo i tag che non esistono già
        addedTags = normalizedNewTags.filter(tag => !item.tags.includes(tag));
        allTags = [...item.tags, ...addedTags];
        item.tags = allTags;
    }
    return {
        success: true,
        context: item,
        scope,
        addedTags,
        allTags
    };
}
/**
 * Restituisce contesti che contengono specifici tag
 */
export function getContextsByTags(tags, specificScope) {
    const normalizedSearchTags = normalizeAndDeduplicateTags(tags);
    if (normalizedSearchTags.length === 0) {
        return [];
    }
    let result = [];
    const allMemory = getAllMemory();
    // Filtra per scope se specificato
    const scopesToSearch = specificScope ? [specificScope] : Object.keys(allMemory);
    for (const scope of scopesToSearch) {
        const items = allMemory[scope] || [];
        // Filtra gli item che hanno tutti i tag specificati
        const matchingItems = items.filter(item => {
            // Se l'item non ha tag, non corrisponde
            if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
                return false;
            }
            // Verifica che tutti i tag di ricerca siano presenti nell'item
            return normalizedSearchTags.every(searchTag => item.tags.includes(searchTag));
        });
        // Aggiungi gli item corrispondenti al risultato
        result = [...result, ...matchingItems.map(item => ({ ...item, scope }))];
    }
    return result;
}
/**
 * Handler principale per context.tag
 */
export const contextTagHandler = async (args) => {
    // Estrai i parametri
    const id = args?.id;
    const tags = args?.tags;
    const replace = args?.replace === true;
    // Valida i parametri
    if (!id) {
        return {
            success: false,
            output: null,
            error: "Il parametro 'id' è obbligatorio"
        };
    }
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return {
            success: false,
            output: null,
            error: "Il parametro 'tags' è obbligatorio e deve essere un array non vuoto di stringhe"
        };
    }
    try {
        // Aggiungi i tag al contesto
        const result = addTagsToContext(id, tags, replace);
        if (!result.success) {
            return {
                success: false,
                output: null,
                error: result.error
            };
        }
        // Salva la memoria su disco
        await persistMemoryToDisk();
        // Prepara l'output
        const outputResult = {
            success: true,
            id: id,
            scope: result.scope,
            addedTags: result.addedTags,
            allTags: result.allTags,
            replace: replace,
            textPreview: result.context.text.length > 50
                ? result.context.text.substring(0, 50) + '...'
                : result.context.text,
            summary: replace
                ? `Tag sostituiti per il contesto con ID '${id}'`
                : `Tag aggiunti al contesto con ID '${id}'`
        };
        return {
            success: true,
            output: JSON.stringify(outputResult)
        };
    }
    catch (error) {
        console.error("Errore nell'aggiunta di tag al contesto:", error);
        return {
            success: false,
            output: null,
            error: `Errore nell'aggiunta di tag al contesto: ${error.message}`
        };
    }
};
//# sourceMappingURL=contextTagHandler.js.map