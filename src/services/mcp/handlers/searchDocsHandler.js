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
// Funzione di ricerca all'interno di un file
async function searchInFile(filePath, matcher, root, results) {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
        if (matcher(line)) {
            results.push({
                file: path.relative(root, filePath),
                line: index + 1,
                snippet: line.trim().slice(0, 200),
            });
        }
    });
}
// Funzione di attraversamento ricorsivo della directory
async function traverse(dir, matcher, root, results) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Ignora node_modules e .git
            if (entry.name === "node_modules" || entry.name === ".git") {
                continue;
            }
            await traverse(fullPath, matcher, root, results);
        }
        else if (entry.isFile() && /\.(md|ts|tsx|js|py|json)$/.test(entry.name)) {
            await searchInFile(fullPath, matcher, root, results);
        }
    }
}
export const searchDocsHandler = async (input) => {
    const query = input?.query;
    const maxResults = input?.maxResults || 3;
    const regexMode = !!input?.regex;
    if (!query || typeof query !== "string") {
        return { success: false, output: null, error: "Parametro 'query' mancante o non valido" };
    }
    let matcher;
    if (regexMode) {
        try {
            const re = new RegExp(query, "i");
            matcher = (line) => re.test(line);
        }
        catch (err) {
            return { success: false, output: null, error: `Espressione regolare non valida: ${err.message}` };
        }
    }
    else {
        matcher = (line) => line.toLowerCase().includes(query.toLowerCase());
    }
    const results = [];
    try {
        // Ottieni il percorso workspace
        let root = process.cwd(); // Default al percorso corrente
        // Se c'è un workspace VS Code aperto, usalo invece
        if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
            root = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
        }
        await traverse(root, matcher, root, results);
        return {
            success: true,
            output: results.slice(0, maxResults),
        };
    }
    catch (err) {
        return {
            success: false,
            output: null,
            error: err.message,
        };
    }
};
//# sourceMappingURL=searchDocsHandler.js.map