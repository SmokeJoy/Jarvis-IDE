/**
 * @file memoryQueryHandler.ts
 * @description Handler per lo strumento memory.query
 * 
 * Questo handler permette di recuperare memorie contestuali 
 * recenti, filtrate per scope e contenuto testuale.
 */

/**
 * Interfaccia che definisce la struttura di un oggetto memoria
 */
interface Memory {
    /** Il ruolo associato alla memoria (user, assistant, system) */
    role: string;
    /** Il contenuto testuale della memoria */
    text: string;
    /** Il timestamp di creazione della memoria */
    timestamp: number;
    /** L'ambito della memoria (chat, project, agent) */
    scope: string;
}

/**
 * Cache di memorie recenti (simulazione di storage in-memory)
 * In un'implementazione reale, queste potrebbero provenire da una fonte di dati persistente
 */
const recentMemories: Memory[] = [
    {
        role: 'user',
        text: 'Come posso implementare il pattern Observer in TypeScript?',
        timestamp: Date.now() - 3600000, // 1 ora fa
        scope: 'chat'
    },
    {
        role: 'assistant',
        text: "Il pattern Observer può essere implementato in TypeScript creando un'interfaccia Subject con metodi per aggiungere, rimuovere e notificare gli observer. Ecco un esempio di implementazione...",
        timestamp: Date.now() - 3500000,
        scope: 'chat'
    },
    {
        role: 'user',
        text: 'Quali file devo modificare per implementare un nuovo handler MCP?',
        timestamp: Date.now() - 1800000, // 30 minuti fa
        scope: 'project'
    },
    {
        role: 'assistant',
        text: 'Per implementare un nuovo handler MCP, dovrai creare un nuovo file nella directory src/services/mcp/handlers/ e poi aggiornare McpDispatcher.ts per includere il tuo nuovo handler.',
        timestamp: Date.now() - 1700000,
        scope: 'project'
    },
    {
        role: 'system',
        text: 'Esecuzione terminata: Test suite MCP completata con successo',
        timestamp: Date.now() - 900000, // 15 minuti fa
        scope: 'agent'
    },
    {
        role: 'user',
        text: 'Mostrami come implementare un memory handler per il progetto',
        timestamp: Date.now() - 300000, // 5 minuti fa
        scope: 'chat'
    }
];

/**
 * Handler per la query di memoria
 * @param args - Argomenti per la query di memoria
 * @returns Array di oggetti memoria che corrispondono ai criteri di ricerca
 */
export async function memoryQueryHandler(args: {
    scope?: string;
    filter?: string;
    limit?: number;
}): Promise<Memory[]> {
    try {
        // Imposta valori predefiniti per i parametri mancanti
        const scope = args.scope || 'all';
        const limit = args.limit || 5;

        // Filtra le memorie in base allo scope
        let results = recentMemories.filter(memory => {
            if (scope === 'all') {
                return true;
            }
            return memory.scope === scope;
        });

        // Applica il filtro testuale se specificato
        if (args.filter) {
            const filterLower = args.filter.toLowerCase();
            results = results.filter(memory => 
                memory.text.toLowerCase().includes(filterLower)
            );
        }

        // Ordina per timestamp (più recenti prima)
        results.sort((a, b) => b.timestamp - a.timestamp);

        // Limita il numero di risultati
        results = results.slice(0, limit);

        return results;
    } catch (error: any) {
        console.error('Errore durante la query di memoria:', error);
        throw new Error(`Errore durante la query di memoria: ${error.message}`);
    }
} 