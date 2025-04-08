import * as fs from "fs/promises";
import * as path from "path";
import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types";
// Mock di vscode per ambienti non-VS Code
const mockVscode = {
    workspace: {
        workspaceFolders: null
    }
};
// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;
// Estensioni di file da considerare nella ricerca
const SUPPORTED_EXTENSIONS = [
    '.md', // Markdown (documentazione)
    '.ts', // TypeScript
    '.tsx', // TypeScript JSX
    '.js', // JavaScript
    '.jsx', // JavaScript JSX
    '.py', // Python
    '.java', // Java
    '.c', // C
    '.cpp', // C++
    '.cs', // C#
    '.go', // Go
    '.rb', // Ruby
    '.php', // PHP
    '.json', // JSON
    '.yml', // YAML
    '.yaml', // YAML
    '.xml', // XML
    '.html', // HTML
    '.css', // CSS
    '.scss', // SCSS
    '.less' // LESS
];
// Cartelle da ignorare durante la ricerca
const IGNORED_DIRECTORIES = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'target',
    '.vscode',
    '.idea',
    'bin',
    'obj',
    'vendor'
];
/**
 * Controlla se un file ha un'estensione supportata
 */
function hasValidExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
}
/**
 * Estrae keywords significative dalla domanda
 * In un'implementazione reale, questo potrebbe usare NLP
 */
function extractKeywords(question) {
    // Rimuovi stopwords e parole comuni
    const stopwords = ['come', 'quale', 'cosa', 'chi', 'dove', 'quando', 'perché', 'come',
        'il', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'e', 'o', 'ma', 'in', 'con', 'su', 'per',
        'da', 'al', 'a', 'è', 'sono', 'ha', 'hanno', 'essere', 'fare', 'avere', 'di'];
    // Estrai parole dalla domanda (semplice tokenizzazione)
    let words = question.toLowerCase()
        .replace(/[^\w\sàèìòù]/g, ' ') // Rimuovi caratteri speciali
        .split(/\s+/) // Dividi in parole
        .filter(word => word.length > 2 && !stopwords.includes(word)); // Rimuovi stopwords e parole corte
    // Rimuovi duplicati
    return [...new Set(words)];
}
/**
 * Valuta la rilevanza di un file rispetto alla domanda
 */
function scoreFileRelevance(fileContent, keywords) {
    const contentLower = fileContent.toLowerCase();
    let score = 0;
    // Conta occorrenze di ciascuna keyword
    for (const keyword of keywords) {
        // Regex globale per contare tutte le occorrenze
        const matches = contentLower.match(new RegExp(`\\b${keyword}\\b`, 'g'));
        if (matches) {
            score += matches.length;
        }
    }
    // Favorisci file più piccoli a parità di rilevanza (evita enormi file con molti falsi positivi)
    const sizeScore = Math.min(1.0, 5000 / Math.max(fileContent.length, 1000));
    return score * sizeScore;
}
/**
 * Estrae un estratto contestuale dal file
 */
function extractContextualExcerpt(content, keywords, maxLength = 500) {
    // Per semplicità, troviamo la prima occorrenza di una keyword e prendiamo il contesto
    const contentLower = content.toLowerCase();
    let bestPosition = -1;
    let bestKeyword = '';
    // Trova la posizione della prima keyword
    for (const keyword of keywords) {
        const position = contentLower.indexOf(keyword);
        if (position !== -1 && (bestPosition === -1 || position < bestPosition)) {
            bestPosition = position;
            bestKeyword = keyword;
        }
    }
    // Se non troviamo keyword, prendi l'inizio del file
    if (bestPosition === -1) {
        return content.slice(0, maxLength);
    }
    // Trova gli inizi e le fini delle righe per estrarre un contesto ragionevole
    const start = Math.max(0, content.lastIndexOf('\n', bestPosition - 100) + 1);
    const end = Math.min(content.length, content.indexOf('\n', bestPosition + bestKeyword.length + 400));
    // Se non troviamo un buon contesto, prendi semplicemente un pezzo intorno alla keyword
    const excerpt = end > start
        ? content.slice(start, end)
        : content.slice(Math.max(0, bestPosition - 200), Math.min(content.length, bestPosition + 300));
    // Tronca se troppo lungo
    return excerpt.length <= maxLength
        ? excerpt
        : excerpt.slice(0, maxLength) + '...';
}
/**
 * Legge il contenuto di un file
 */
async function readFileContent(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    }
    catch (error) {
        console.error(`Errore nella lettura del file ${filePath}:`, error);
        return ''; // Ritorna stringa vuota in caso di errore
    }
}
/**
 * Cerca nei file del workspace
 */
async function searchInWorkspace(workspacePath, filter, maxFiles) {
    const pendingFiles = [];
    // Funzione ricorsiva per attraversare directory
    async function traverseDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                // Salta directory ignorate
                if (entry.isDirectory()) {
                    if (IGNORED_DIRECTORIES.includes(entry.name)) {
                        continue;
                    }
                    await traverseDirectory(fullPath);
                }
                // Considera solo file con estensioni supportate
                else if (entry.isFile() && hasValidExtension(fullPath)) {
                    // Se abbiamo un filtro, verifica che il file lo soddisfi
                    if (filter) {
                        const relativePath = path.relative(workspacePath, fullPath);
                        // Supporta filtri di tipo file:percorso
                        if (filter.startsWith('file:')) {
                            const filePattern = filter.substring(5);
                            if (!relativePath.includes(filePattern)) {
                                continue;
                            }
                        }
                        // Altrimenti usa il filtro come testo generico da trovare nel nome file
                        else if (!relativePath.toLowerCase().includes(filter.toLowerCase())) {
                            continue;
                        }
                    }
                    pendingFiles.push(fullPath);
                }
            }
        }
        catch (error) {
            console.error(`Errore durante la scansione della directory ${dirPath}:`, error);
        }
    }
    // Inizia la traversazione dalla directory di base
    await traverseDirectory(workspacePath);
    return pendingFiles;
}
/**
 * Handler per la richiesta semantica di documentazione
 */
export const askDocsHandler = async (args) => {
    // Validazione parametri
    const question = args?.question;
    const filter = args?.filter;
    const maxSourceFiles = args?.maxSourceFiles || 5;
    const includeCode = args?.includeCode !== false; // true di default
    if (!question || typeof question !== 'string') {
        return {
            success: false,
            output: null,
            error: "Parametro 'question' mancante o non valido"
        };
    }
    try {
        // Ottieni il percorso workspace
        let workspacePath = process.cwd();
        if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
            workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
        }
        // Estrai keywords dalla domanda per la ricerca
        const keywords = extractKeywords(question);
        if (keywords.length === 0) {
            return {
                success: false,
                output: null,
                error: "Impossibile estrarre parole chiave significative dalla domanda"
            };
        }
        // Cerca file rilevanti nel workspace
        const filePaths = await searchInWorkspace(workspacePath, filter, maxSourceFiles * 3);
        if (filePaths.length === 0) {
            return {
                success: false,
                output: null,
                error: filter
                    ? `Nessun file trovato che corrisponda al filtro '${filter}'`
                    : "Nessun file trovato nel workspace"
            };
        }
        // Leggi i contenuti dei file e calcola i punteggi di rilevanza
        const fileMatches = [];
        for (const filePath of filePaths) {
            const content = await readFileContent(filePath);
            if (content) {
                const score = scoreFileRelevance(content, keywords);
                if (score > 0) {
                    fileMatches.push({
                        file: path.relative(workspacePath, filePath),
                        content: content,
                        score: score,
                        excerpt: extractContextualExcerpt(content, keywords)
                    });
                }
            }
        }
        // Ordina per punteggio di rilevanza
        fileMatches.sort((a, b) => b.score - a.score);
        // Prendi i migliori N file
        const topMatches = fileMatches.slice(0, maxSourceFiles);
        if (topMatches.length === 0) {
            return {
                success: false,
                output: null,
                error: "Nessun file rilevante trovato per la domanda specificata"
            };
        }
        // Genera la risposta con sezioni per ciascun file rilevante
        let responseContent = `# Risposta alla domanda: "${question}"\n\n`;
        // In un'implementazione reale, qui chiameremmo un LLM
        // per generare una risposta contestualizzata usando i file rilevanti
        // Per questa versione simulata, costruiamo una risposta basata sui file trovati
        responseContent += simulateAnswerGeneration(question, topMatches, includeCode);
        // Prepara informazioni sui file usati
        const sourcesUsed = topMatches.map(match => ({
            file: match.file,
            relevance: match.score
        }));
        return {
            success: true,
            output: {
                answer: responseContent,
                sources: sourcesUsed,
                keywords: keywords
            }
        };
    }
    catch (error) {
        return {
            success: false,
            output: null,
            error: `Errore durante l'interrogazione della documentazione: ${error.message}`
        };
    }
};
/**
 * Simula la generazione di una risposta basata sui file rilevanti
 * In un'implementazione reale, questa funzione chiamerebbe un LLM
 */
function simulateAnswerGeneration(question, files, includeCode) {
    // Simuliamo una risposta basata sui file trovati
    let answer = "";
    // Implementazione sintetica - in un caso reale, qui useremmo un LLM
    // che analizza i file e risponde alla domanda
    answer += `Ho analizzato ${files.length} file rilevanti per la tua domanda.\n\n`;
    // Generale spiegazione basata sui file trovati
    answer += "## Analisi\n\n";
    answer += `La tua domanda riguarda probabilmente ${files.length > 0 ? path.basename(files[0].file) : "alcuni aspetti"} del progetto.\n`;
    answer += "Da quello che ho trovato nei file più rilevanti:\n\n";
    // Aggiungi informazioni per ciascun file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        answer += `### ${i + 1}. File: \`${file.file}\`\n\n`;
        // Estrai alcune informazioni basilari dal file
        answer += "Questo file sembra contenere ";
        if (file.file.endsWith('.md')) {
            answer += "documentazione in formato Markdown";
        }
        else if (file.file.endsWith('.ts') || file.file.endsWith('.tsx')) {
            answer += "codice TypeScript";
        }
        else if (file.file.endsWith('.js') || file.file.endsWith('.jsx')) {
            answer += "codice JavaScript";
        }
        else if (file.file.endsWith('.py')) {
            answer += "codice Python";
        }
        else if (file.file.endsWith('.java')) {
            answer += "codice Java";
        }
        else {
            answer += `codice o dati in formato ${path.extname(file.file).substring(1)}`;
        }
        answer += ".\n\n";
        // Se richiesto, includi un estratto di codice contestuale
        if (includeCode) {
            answer += "**Estratto pertinente:**\n\n";
            answer += "```" + path.extname(file.file).substring(1) + "\n";
            answer += file.excerpt;
            answer += "\n```\n\n";
        }
    }
    // Aggiungi conclusione
    answer += "## Conclusione\n\n";
    answer += "Questa è una simulazione di risposta. In un'implementazione reale, un modello di linguaggio analizzerebbe i file trovati e genererebbe una risposta contestualizzata alla tua domanda.\n";
    answer += "I file mostrati contengono le informazioni più rilevanti che ho trovato in base alle parole chiave della tua domanda.\n";
    return answer;
}
//# sourceMappingURL=askDocsHandler.js.map