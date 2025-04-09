/**
 * @file projectSummaryHandler.ts
 * @description Handler per lo strumento project.summary
 *
 * Questo handler genera un riepilogo del progetto che include
 * la struttura delle directory, informazioni sui file chiave
 * e una breve descrizione del progetto.
 */
/**
 * Handler principale per la generazione del riepilogo del progetto
 * @param args Argomenti per la generazione del riepilogo
 * @returns Riepilogo del progetto in formato Markdown
 */
export declare function projectSummaryHandler(args: {
    depth?: number;
    includeFiles?: boolean;
}): Promise<string>;
//# sourceMappingURL=projectSummaryHandler.d.ts.map