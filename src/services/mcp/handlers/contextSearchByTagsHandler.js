import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types";
import { getAllMemory } from "./contextInjectHandler";
import { normalizeTag } from "./contextTagHandler";
/**
 * Calcola la similarità tra due stringhe usando la distanza di Levenshtein
 */
function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    // Matrice per il calcolo della distanza
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    // Inizializzazione della prima riga e colonna
    for (let i = 0; i <= len1; i++)
        matrix[i][0] = i;
    for (let j = 0; j <= len2; j++)
        matrix[0][j] = j;
    // Calcolo della distanza
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // cancellazione
            matrix[i][j - 1] + 1, // inserimento
            matrix[i - 1][j - 1] + cost // sostituzione
            );
        }
    }
    // Calcolo della similarità (1 - distanza normalizzata)
    const maxLen = Math.max(len1, len2);
    return 1 - (matrix[len1][len2] / maxLen);
}
/**
 * Cerca contesti che corrispondono ai tag specificati
 */
export function searchContextsByTags(tags, scope, similarityThreshold = 0.7) {
    // Normalizza i tag di ricerca
    const normalizedSearchTags = tags.map(tag => normalizeTag(tag));
    if (normalizedSearchTags.length === 0) {
        return [];
    }
    let result = [];
    const allMemory = getAllMemory();
    // Filtra per scope se specificato
    const scopesToSearch = scope ? [scope] : Object.keys(allMemory);
    for (const scope of scopesToSearch) {
        const items = allMemory[scope] || [];
        // Filtra gli item che hanno tutti i tag specificati (con similarità)
        const matchingItems = items.filter(item => {
            if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
                return false;
            }
            // Verifica che tutti i tag di ricerca abbiano una corrispondenza
            return normalizedSearchTags.every(searchTag => {
                // Cerca una corrispondenza esatta o fuzzy
                return item.tags.some(itemTag => {
                    const normalizedItemTag = normalizeTag(itemTag);
                    if (normalizedItemTag === searchTag)
                        return true;
                    // Calcola la similarità se non c'è corrispondenza esatta
                    const similarity = calculateSimilarity(normalizedItemTag, searchTag);
                    return similarity >= similarityThreshold;
                });
            });
        });
        // Aggiungi gli item corrispondenti al risultato con il punteggio di rilevanza
        result = [
            ...result,
            ...matchingItems.map(item => {
                // Calcola il punteggio di rilevanza basato sulla similarità dei tag
                const relevanceScore = normalizedSearchTags.reduce((score, searchTag) => {
                    const maxSimilarity = item.tags.reduce((max, itemTag) => {
                        const normalizedItemTag = normalizeTag(itemTag);
                        const similarity = normalizedItemTag === searchTag
                            ? 1
                            : calculateSimilarity(normalizedItemTag, searchTag);
                        return Math.max(max, similarity);
                    }, 0);
                    return score + maxSimilarity;
                }, 0) / normalizedSearchTags.length;
                return {
                    ...item,
                    scope,
                    relevanceScore
                };
            })
        ];
    }
    // Ordina per rilevanza
    return result.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
/**
 * Handler principale per context.searchByTags
 */
export const contextSearchByTagsHandler = async (args) => {
    // Estrai i parametri
    const tags = args?.tags;
    const scope = args?.scope;
    const limit = args?.limit && !isNaN(parseInt(args.limit)) ? parseInt(args.limit) : 50;
    const similarityThreshold = args?.similarityThreshold && !isNaN(parseFloat(args.similarityThreshold))
        ? parseFloat(args.similarityThreshold)
        : 0.7;
    // Valida i parametri
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return {
            success: false,
            output: null,
            error: "Il parametro 'tags' è obbligatorio e deve essere un array non vuoto di stringhe"
        };
    }
    if (scope && !['chat', 'project', 'agent'].includes(scope)) {
        return {
            success: false,
            output: null,
            error: `Scope '${scope}' non valido. Valori ammessi: chat, project, agent`
        };
    }
    try {
        // Esegui la ricerca
        const results = searchContextsByTags(tags, scope, similarityThreshold);
        // Limita i risultati
        const limitedResults = results.slice(0, limit);
        // Prepara l'output
        const outputResult = {
            total: results.length,
            limit,
            scope: scope || 'all',
            similarityThreshold,
            items: limitedResults.map(item => ({
                id: item.id,
                scope: item.scope,
                timestamp: item.timestamp,
                date: new Date(item.timestamp).toISOString(),
                textPreview: item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text,
                tags: item.tags || [],
                relevanceScore: item.relevanceScore
            })),
            summary: `Trovati ${results.length} contesti con i tag specificati${scope ? ` nello scope '${scope}'` : ''}`
        };
        return {
            success: true,
            output: JSON.stringify(outputResult)
        };
    }
    catch (error) {
        console.error("Errore nella ricerca per tag:", error);
        return {
            success: false,
            output: null,
            error: `Errore nella ricerca per tag: ${error.message}`
        };
    }
};
//# sourceMappingURL=contextSearchByTagsHandler.js.map