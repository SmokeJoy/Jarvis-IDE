import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types";
import { getAllMemory, getFromMemory, persistMemoryToDisk } from "./contextInjectHandler";
/**
 * Rimuove un elemento specifico dalla memoria in base all'ID
 * @returns true se l'elemento è stato rimosso, false se non è stato trovato
 */
function removeItemById(id, scope) {
    if (scope) {
        // Rimuovi solo dallo scope specificato
        const items = getFromMemory(scope);
        const initialLength = items.length;
        const indexToRemove = items.findIndex(item => item.id === id);
        if (indexToRemove !== -1) {
            items.splice(indexToRemove, 1);
            return true;
        }
        return false;
    }
    else {
        // Cerca in tutti gli scope
        const allMemory = getAllMemory();
        let found = false;
        for (const scopeKey in allMemory) {
            const items = allMemory[scopeKey];
            const indexToRemove = items.findIndex(item => item.id === id);
            if (indexToRemove !== -1) {
                items.splice(indexToRemove, 1);
                found = true;
                break; // ID sono univoci, quindi usciamo dopo la prima rimozione
            }
        }
        return found;
    }
}
/**
 * Rimuove tutti gli elementi da uno scope specifico
 * @returns il numero di elementi rimossi
 */
function clearScope(scope) {
    const items = getFromMemory(scope);
    const count = items.length;
    // Svuota l'array
    if (items.length > 0) {
        items.length = 0;
    }
    return count;
}
/**
 * Rimuove tutti gli elementi da tutti gli scope
 * @returns oggetto con il conteggio per ogni scope
 */
function clearAllScopes() {
    const allMemory = getAllMemory();
    const counts = {};
    let totalCount = 0;
    for (const scopeKey in allMemory) {
        const items = allMemory[scopeKey];
        counts[scopeKey] = items.length;
        totalCount += items.length;
        // Svuota l'array
        if (items.length > 0) {
            items.length = 0;
        }
    }
    counts.total = totalCount;
    return counts;
}
/**
 * Handler principale per context.clear
 */
export const contextClearHandler = async (args) => {
    // Estrai i parametri
    const scope = args?.scope;
    const id = args?.id;
    const all = args?.all === true;
    // Valida i parametri
    if (scope && !['chat', 'project', 'agent'].includes(scope)) {
        return {
            success: false,
            output: null,
            error: `Scope '${scope}' non valido. Valori ammessi: chat, project, agent`
        };
    }
    // Verifica che almeno uno tra id e all sia specificato
    if (!id && !all) {
        return {
            success: false,
            output: null,
            error: "È necessario specificare almeno uno tra 'id' (per rimuovere un elemento specifico) e 'all' (per rimuovere tutti gli elementi)"
        };
    }
    try {
        let result;
        // Strategia 1: rimozione per ID (prioritaria)
        if (id) {
            const removed = removeItemById(id, scope);
            result = {
                success: removed,
                deletedCount: removed ? 1 : 0,
                id: id,
                scope: scope || 'all',
                summary: removed
                    ? `Elemento con ID '${id}' rimosso con successo${scope ? ` dallo scope '${scope}'` : ''}`
                    : `Nessun elemento trovato con ID '${id}'${scope ? ` nello scope '${scope}'` : ''}`
            };
        }
        // Strategia 2: rimozione di tutti gli elementi
        else if (all) {
            if (scope) {
                // Rimuovi tutti gli elementi da uno scope specifico
                const count = clearScope(scope);
                result = {
                    success: true,
                    deletedCount: count,
                    scope: scope,
                    summary: count > 0
                        ? `${count} elementi rimossi dallo scope '${scope}'`
                        : `Nessun elemento trovato nello scope '${scope}'`
                };
            }
            else {
                // Rimuovi tutti gli elementi da tutti gli scope
                const counts = clearAllScopes();
                result = {
                    success: true,
                    deletedCount: counts.total,
                    scopeCounts: counts,
                    summary: counts.total > 0
                        ? `${counts.total} elementi rimossi da tutti gli scope (chat: ${counts.chat}, project: ${counts.project}, agent: ${counts.agent})`
                        : "Nessun elemento trovato in memoria"
                };
            }
        }
        // Salva lo stato aggiornato della memoria su disco
        await persistMemoryToDisk();
        return {
            success: true,
            output: JSON.stringify(result)
        };
    }
    catch (error) {
        console.error("Errore nella cancellazione dei contesti:", error);
        return {
            success: false,
            output: null,
            error: `Errore nella cancellazione dei contesti: ${error.message}`
        };
    }
};
//# sourceMappingURL=contextClearHandler.js.map