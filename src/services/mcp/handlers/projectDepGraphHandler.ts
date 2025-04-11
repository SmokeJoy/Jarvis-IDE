import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";

// Promisify exec per usare con async/await
const execAsync = promisify(exec);

// Mock di vscode per ambienti non-VS Code
const mockVscode = {
  workspace: {
    workspaceFolders: null
  }
};

// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

/**
 * Verifica esistenza del file/cartella
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera il grafo delle dipendenze usando dependency-cruiser
 */
async function generateDepGraph(
  entryPoint: string, 
  format: 'json' | 'dot' | 'tree',
  depth?: number, 
  workspacePath: string
): Promise<string> {
  // Costruisci il comando base
  const formatFlag = format === 'json' ? '--output-type json' :
                     format === 'dot' ? '--output-type dot' :
                     '--output-type tree';
  
  // Aggiungi il parametro di profondità se specificato
  const depthArg = depth !== undefined ? `--max-depth ${depth}` : '';
  
  // Costruisci il comando completo
  const cmd = `npx depcruise ${entryPoint} ${formatFlag} ${depthArg}`;
  
  // Esegui il comando
  try {
    const { stdout } = await execAsync(cmd, { cwd: workspacePath });
    return stdout;
  } catch (error: any) {
    // Se il comando fallisce ma genera output, potrebbe essere un warning ma con risultati validi
    if (error.stdout) {
      console.warn("Avviso durante la generazione del grafo delle dipendenze:", error.stderr);
      return error.stdout;
    }
    
    // Se dependency-cruiser non è installato, prova ad installarlo
    if (error.message?.includes('not found') || error.message?.includes('non trovato')) {
      console.log("dependency-cruiser non trovato, tentativo di installazione...");
      await execAsync('npm install --no-save dependency-cruiser', { cwd: workspacePath });
      
      // Riprova il comando dopo l'installazione
      const { stdout } = await execAsync(cmd, { cwd: workspacePath });
      return stdout;
    }
    
    // In caso di altri errori, propaga l'errore
    throw new Error(`Errore nell'esecuzione di dependency-cruiser: ${error.message}`);
  }
}

/**
 * Semplifica il grafo JSON rimovendo dettagli non necessari
 */
function simplifyJsonGraph(jsonGraph: string): any {
  try {
    const graph = JSON.parse(jsonGraph);
    
    // Semplifica i moduli mantenendo solo informazioni essenziali
    if (graph.modules) {
      graph.modules = graph.modules.map((mod: any) => ({
        source: mod.source,
        dependencies: mod.dependencies?.map((dep: any) => ({
          resolved: dep.resolved,
          type: dep.type,
          circular: dep.circular || false
        })) || []
      }));
    }
    
    return graph;
  } catch (error) {
    console.error("Errore nella semplificazione del grafo JSON:", error);
    return JSON.parse(jsonGraph); // Ritorna il grafo originale in caso di errore
  }
}

/**
 * Handler principale per project.depgraph
 */
export const projectDepGraphHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  // Estrai i parametri
  const entryPoint = args?.entryPoint || '.';
  const depth = args?.depth;
  const format = (args?.format || 'json') as 'json' | 'dot' | 'tree';
  
  // Valida il formato
  if (!['json', 'dot', 'tree'].includes(format)) {
    return {
      success: false,
      output: null,
      error: `Formato '${format}' non valido. Formati supportati: json, dot, tree`
    };
  }
  
  try {
    // Ottieni il percorso workspace
    let workspacePath = process.cwd();
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }
    
    // Risolvi path completo
    const fullPath = path.isAbsolute(entryPoint) 
      ? entryPoint 
      : path.join(workspacePath, entryPoint);
    
    // Verifica esistenza percorso
    const exists = await fileExists(fullPath);
    if (!exists) {
      return {
        success: false,
        output: null,
        error: `Il percorso '${entryPoint}' non esiste`
      };
    }
    
    // Genera il grafo delle dipendenze
    const graphOutput = await generateDepGraph(fullPath, format, depth, workspacePath);
    
    // Se il formato è JSON, semplifica il grafo
    let result = graphOutput;
    let outputJson: any = {
      format,
      entryPoint,
      summary: `Grafico delle dipendenze generato per '${entryPoint}'`
    };
    
    if (format === 'json') {
      // Semplifica e aggiungi all'output
      const simplifiedGraph = simplifyJsonGraph(graphOutput);
      outputJson.graph = simplifiedGraph;
      result = JSON.stringify(outputJson);
    } else if (format === 'dot') {
      // Per DOT, mantieni l'output originale ma aggiungi metadati
      outputJson.graph = graphOutput;
      result = JSON.stringify(outputJson);
    } else {
      // Per tree, mantieni l'output testuale
      outputJson.graph = graphOutput;
      result = JSON.stringify(outputJson);
    }
    
    return {
      success: true,
      output: result
    };
  } catch (error: any) {
    console.error("Errore nell'analisi del grafo delle dipendenze:", error);
    return {
      success: false,
      output: null,
      error: `Errore nell'analisi del grafo delle dipendenze: ${error.message}`
    };
  }
}; 