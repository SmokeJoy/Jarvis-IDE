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
 * Handler per la query di memoria
 * @param args - Argomenti per la query di memoria
 * @returns Array di oggetti memoria che corrispondono ai criteri di ricerca
 */
export declare function memoryQueryHandler(args: {
    scope?: string;
    filter?: string;
    limit?: number;
}): Promise<Memory[]>;
export {};
//# sourceMappingURL=memoryQueryHandler.d.ts.map