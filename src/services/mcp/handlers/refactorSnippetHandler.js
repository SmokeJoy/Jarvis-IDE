import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";
/**
 * Lingue supportate e relative configurazioni per il refactoring
 */
const SUPPORTED_LANGUAGES = [
    "typescript", "ts",
    "javascript", "js",
    "python", "py",
    "java",
    "csharp", "cs",
    "c++", "cpp",
    "go",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin"
];
/**
 * Normalizza il nome della lingua per gestire sinonimi e abbreviazioni
 */
function normalizeLanguage(language) {
    const lang = language.toLowerCase().trim();
    // Mappa abbreviazioni e varianti
    if (lang === "ts")
        return "typescript";
    if (lang === "js")
        return "javascript";
    if (lang === "py")
        return "python";
    if (lang === "cs")
        return "csharp";
    if (lang === "cpp" || lang === "c++")
        return "cpp";
    return lang;
}
/**
 * Controlla se una lingua è supportata per il refactoring
 */
function isLanguageSupported(language) {
    const normalizedLang = normalizeLanguage(language);
    return SUPPORTED_LANGUAGES.includes(normalizedLang);
}
/**
 * Genera commenti e stile di codice appropriati in base alla lingua
 */
function getLanguageCommentStyle(language) {
    const normalizedLang = normalizeLanguage(language);
    switch (normalizedLang) {
        case "python":
            return { line: "#", blockStart: "'''", blockEnd: "'''" };
        case "html":
            return { line: "<!-- ", blockStart: "<!-- ", blockEnd: " -->" };
        case "css":
        case "less":
        case "scss":
            return { line: "/* ", blockStart: "/* ", blockEnd: " */" };
        default:
            // JavaScript, TypeScript, Java, C#, PHP, ecc.
            return { line: "//", blockStart: "/*", blockEnd: "*/" };
    }
}
/**
 * Handler per il comando refactor.snippet
 * Esegue il refactoring di uno snippet di codice in base all'obiettivo
 */
export const refactorSnippetHandler = async (args) => {
    // Validazione parametri
    const language = args?.language;
    const code = args?.code;
    const objective = args?.objective;
    const includeExplanation = args?.explanation !== false; // Default a true
    // Verifica parametri obbligatori
    if (!language || typeof language !== "string") {
        return {
            success: false,
            output: null,
            error: "Parametro 'language' mancante o non valido"
        };
    }
    if (!code || typeof code !== "string") {
        return {
            success: false,
            output: null,
            error: "Parametro 'code' mancante o non valido"
        };
    }
    if (!objective || typeof objective !== "string") {
        return {
            success: false,
            output: null,
            error: "Parametro 'objective' mancante o non valido"
        };
    }
    // Verifica che la lingua sia supportata
    if (!isLanguageSupported(language)) {
        return {
            success: false,
            output: null,
            error: `Linguaggio '${language}' non supportato per il refactoring. Linguaggi supportati: ${SUPPORTED_LANGUAGES.join(', ')}`
        };
    }
    try {
        // Normalizza la lingua per processi successivi
        const normalizedLanguage = normalizeLanguage(language);
        // Qui andrebbe eventualmente chiamata una funzione che utilizza un LLM
        // per analizzare e rifattorizzare il codice. In questa implementazione
        // di esempio, simuliamo un refactoring usando un modello predefinito.
        // Prepariamo una risposta simulata (in un'implementazione reale,
        // il codice effettivo verrebbe rifattorizzato basandosi sull'obiettivo)
        const commentStyle = getLanguageCommentStyle(normalizedLanguage);
        // In una vera implementazione, qui andrebbe inserita la chiamata al modello LLM
        // che prende in input il codice e l'obiettivo, e restituisce il codice rifattorizzato
        // Simuliamo un refactoring di esempio
        const refactoredCode = simulateRefactoring(code, objective, normalizedLanguage, commentStyle);
        // Prepara la spiegazione se richiesta
        let explanation = "";
        if (includeExplanation) {
            explanation = generateExplanation(objective, normalizedLanguage);
        }
        return {
            success: true,
            output: {
                original: code,
                refactored: refactoredCode,
                language: normalizedLanguage,
                objective: objective,
                explanation: includeExplanation ? explanation : undefined
            }
        };
    }
    catch (error) {
        return {
            success: false,
            output: null,
            error: `Errore durante il refactoring: ${error.message}`
        };
    }
};
/**
 * Funzione di esempio che simula un refactoring
 * In una vera implementazione, questa verrebbe sostituita da una chiamata a un LLM
 */
function simulateRefactoring(code, objective, language, commentStyle) {
    // In questo esempio, aggiungiamo solo commenti e piccoli accorgimenti
    // In una implementazione reale, qui andrebbero inserite tecniche di refactoring
    // basate sull'obiettivo e su un'analisi intelligente
    const lines = code.split('\n');
    // Aggiungiamo un commento di intestazione che spiega il refactoring
    const header = [
        `${commentStyle.blockStart}`,
        ` * REFACTORED CODE`,
        ` * Obiettivo: ${objective}`,
        ` * Linguaggio: ${language}`,
        ` * Nota: Questo è un esempio di refactoring simulato.`,
        ` * In una vera implementazione, questo codice verrebbe analizzato e migliorato`,
        ` * secondo criteri specifici legati all'obiettivo richiesto.`,
        `${commentStyle.blockEnd}`,
        ''
    ].join('\n');
    // Modifichiamo il codice originale (in questo caso, solo simulazioni di base)
    // In un'implementazione reale, qui andrebbe un vero engine di refactoring
    const modifiedLines = lines.map(line => {
        // Sostituiamo var con let/const in JavaScript/TypeScript
        if (["javascript", "typescript"].includes(language) && line.trim().startsWith('var ')) {
            return line.replace('var ', 'const ');
        }
        // Altre sostituzioni di esempio...
        return line;
    });
    return header + modifiedLines.join('\n');
}
/**
 * Genera una spiegazione del refactoring
 * In una vera implementazione, questa verrebbe generata in base alle modifiche effettuate
 */
function generateExplanation(objective, language) {
    return `
## Spiegazione del refactoring

L'obiettivo era: "${objective}"

Sono state applicate le seguenti modifiche:

1. Aggiunto un blocco di commenti all'inizio del file per documentare il refactoring
2. Sostituito l'uso di variabili "var" con "const" ove appropriato (per JavaScript/TypeScript)
3. Migliorata la leggibilità e la struttura del codice

Nota: in un'implementazione reale, questa spiegazione sarebbe generata analizzando 
le modifiche effettive apportate al codice originale, spiegando nel dettaglio le
strategie di refactoring applicate in relazione all'obiettivo specificato.
`;
}
//# sourceMappingURL=refactorSnippetHandler.js.map