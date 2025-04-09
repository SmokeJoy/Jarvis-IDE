import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { fileExistsAtPath } from '../../utils/fs.js.js';
import { DiffViewProvider } from '../../integrations/editor/DiffViewProvider.js.js';

export class FileManager {
    private static instance: FileManager;
    private diffViewProvider: DiffViewProvider;

    private constructor(private workspacePath: string) {
        this.diffViewProvider = new DiffViewProvider(workspacePath);
    }

    public static getInstance(workspacePath: string): FileManager {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager(workspacePath);
        }
        return FileManager.instance;
    }

    /**
     * Legge il contenuto di un file
     */
    public async readFile(filePath: string): Promise<string> {
        const absolutePath = path.resolve(this.workspacePath, filePath);
        try {
            const content = await fs.readFile(absolutePath, 'utf-8');
            return content;
        } catch (error) {
            throw new Error(`Errore nella lettura del file ${filePath}: ${error}`);
        }
    }

    /**
     * Modifica un file esistente
     */
    public async editFile(filePath: string, newContent: string): Promise<void> {
        const absolutePath = path.resolve(this.workspacePath, filePath);
        
        // Verifica se il file esiste
        const exists = await fileExistsAtPath(absolutePath);
        if (!exists) {
            throw new Error(`Il file ${filePath} non esiste`);
        }

        try {
            // Apri il file in modalità diff
            this.diffViewProvider.editType = "modify";
            await this.diffViewProvider.open(filePath);
            
            // Aggiorna il contenuto
            await this.diffViewProvider.update(newContent, true);
            
            // Salva le modifiche
            const result = await this.diffViewProvider.saveChanges();
            
            // Gestisci eventuali problemi
            if (result.newProblemsMessage) {
                throw new Error(`Problemi rilevati dopo il salvataggio: ${result.newProblemsMessage}`);
            }

            // Reset del provider
            await this.diffViewProvider.reset();
        } catch (error) {
            // In caso di errore, annulla le modifiche
            await this.diffViewProvider.revertChanges();
            throw error;
        }
    }

    /**
     * Crea un nuovo file
     */
    public async createFile(filePath: string, content: string): Promise<void> {
        const absolutePath = path.resolve(this.workspacePath, filePath);
        
        // Verifica se il file esiste già
        const exists = await fileExistsAtPath(absolutePath);
        if (exists) {
            throw new Error(`Il file ${filePath} esiste già`);
        }

        try {
            // Crea il file in modalità diff
            this.diffViewProvider.editType = "create";
            await this.diffViewProvider.open(filePath);
            
            // Inserisci il contenuto
            await this.diffViewProvider.update(content, true);
            
            // Salva il file
            const result = await this.diffViewProvider.saveChanges();
            
            // Gestisci eventuali problemi
            if (result.newProblemsMessage) {
                throw new Error(`Problemi rilevati dopo il salvataggio: ${result.newProblemsMessage}`);
            }

            // Reset del provider
            await this.diffViewProvider.reset();
        } catch (error) {
            // In caso di errore, annulla la creazione
            await this.diffViewProvider.revertChanges();
            throw error;
        }
    }

    /**
     * Elimina un file
     */
    public async deleteFile(filePath: string): Promise<void> {
        const absolutePath = path.resolve(this.workspacePath, filePath);
        
        try {
            await fs.unlink(absolutePath);
        } catch (error) {
            throw new Error(`Errore nell'eliminazione del file ${filePath}: ${error}`);
        }
    }

    /**
     * Lista i file in una directory
     */
    public async listFiles(dirPath: string = '.'): Promise<string[]> {
        const absolutePath = path.resolve(this.workspacePath, dirPath);
        
        try {
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            const files = entries
                .filter(entry => entry.isFile())
                .map(entry => path.join(dirPath, entry.name));
            return files;
        } catch (error) {
            throw new Error(`Errore nella lettura della directory ${dirPath}: ${error}`);
        }
    }

    /**
     * Lista ricorsivamente tutti i file in una directory
     */
    public async listFilesRecursive(dirPath: string = '.'): Promise<string[]> {
        const absolutePath = path.resolve(this.workspacePath, dirPath);
        const files: string[] = [];

        async function walk(dir: string) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile()) {
                    files.push(path.relative(absolutePath, fullPath));
                }
            }
        }

        try {
            await walk(absolutePath);
            return files;
        } catch (error) {
            throw new Error(`Errore nella lettura ricorsiva della directory ${dirPath}: ${error}`);
        }
    }
} 