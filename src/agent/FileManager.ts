import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../utils/logger.js.js';

export interface ProjectContext {
  content: string;
  numFiles: number;
  fileList: string[];
}

export class FileManager {
  /**
   * Legge i file del progetto per generare un contesto di conoscenza
   * @param dir Directory da cui partire
   * @param extensions Array di estensioni di file da includere
   * @param maxFiles Numero massimo di file da leggere (default: 50)
   * @param maxSizePerFile Dimensione massima per file in caratteri (default: 100KB)
   * @returns Contesto del progetto
   */
  public static async readProjectFiles(
    dir: string,
    extensions: string[],
    maxFiles: number = 50,
    maxSizePerFile: number = 100 * 1024
  ): Promise<ProjectContext> {
    try {
      const fileList: string[] = [];
      let content = '';
      let filesProcessed = 0;
      
      // Funzione ricorsiva per attraversare le directory
      const processDirectory = async (currentDir: string) => {
        // Salta node_modules, .git e altre directory da ignorare
        if (
          currentDir.includes('node_modules') ||
          currentDir.includes('.git') ||
          currentDir.includes('dist') ||
          currentDir.includes('build')
        ) {
          return;
        }

        if (filesProcessed >= maxFiles) {
          return;
        }
        
        try {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          
          for (const entry of entries) {
            if (filesProcessed >= maxFiles) {
              break;
            }
            
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
              await processDirectory(fullPath);
            } else if (
              extensions.some(ext => entry.name.endsWith(ext)) &&
              fs.statSync(fullPath).size <= maxSizePerFile
            ) {
              try {
                // Leggi il contenuto del file
                const fileContent = fs.readFileSync(fullPath, 'utf-8');
                
                // Aggiungi il file al contesto
                const relativePath = path.relative(dir, fullPath);
                fileList.push(relativePath);
                
                content += `\n---\n# FILE: ${relativePath}\n\`\`\`${this.getLanguageFromPath(fullPath)}\n${fileContent}\n\`\`\`\n`;
                
                filesProcessed++;
              } catch (error) {
                Logger.error(`Errore nella lettura del file ${fullPath}: ${error}`);
              }
            }
          }
        } catch (error) {
          Logger.error(`Errore nell'accesso alla directory ${currentDir}: ${error}`);
        }
      };
      
      await processDirectory(dir);
      
      return {
        content,
        numFiles: filesProcessed,
        fileList
      };
    } catch (error) {
      Logger.error(`Errore nella lettura dei file del progetto: ${error}`);
      return {
        content: '',
        numFiles: 0,
        fileList: []
      };
    }
  }
  
  /**
   * Scrive un file sul disco
   * @param filePath Percorso del file da scrivere
   * @param content Contenuto da scrivere nel file
   */
  public static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Assicurati che la directory del file esista
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Scrivi il file
      fs.writeFileSync(filePath, content, 'utf-8');
      
    } catch (error) {
      Logger.error(`Errore nella scrittura del file ${filePath}: ${error}`);
      throw new Error(`Errore nella scrittura del file ${filePath}: ${error}`);
    }
  }
  
  /**
   * Legge il contenuto di un file
   * @param filePath Percorso del file da leggere
   * @returns Contenuto del file
   */
  public static async readFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      Logger.error(`Errore nella lettura del file ${filePath}: ${error}`);
      throw new Error(`Errore nella lettura del file ${filePath}: ${error}`);
    }
  }
  
  /**
   * Ottiene il linguaggio dal percorso del file per la formattazione del codice
   * @param filePath Percorso del file
   * @returns Nome del linguaggio per la formattazione
   */
  private static getLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.cs':
        return 'csharp';
      case '.json':
        return 'json';
      case '.md':
        return 'markdown';
      case '.html':
        return 'html';
      case '.css':
        return 'css';
      case '.scss':
        return 'scss';
      case '.py':
        return 'python';
      default:
        return '';
    }
  }
} 