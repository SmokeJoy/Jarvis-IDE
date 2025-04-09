import { FileManager } from '../file-operations/FileManager.js.js';
import * as vscode from 'vscode';
import type { OpenAiCompatibleModelInfo } from '../../shared/types/api.types.js.js';
import { ApiProvider } from '../../agent/api/ApiProvider.js.js';

interface AIFileOperation {
    type: 'read' | 'edit' | 'create' | 'delete' | 'list' | 'listRecursive';
    path: string;
    content?: string;
    reason?: string;
}

export class AIFileManager {
    private static instance: AIFileManager;
    private fileManager: FileManager;
    private currentModel?: OpenAiCompatibleModelInfo;
    private currentProvider?: ApiProvider;

    private constructor(workspacePath: string) {
        this.fileManager = FileManager.getInstance(workspacePath);
    }

    public static getInstance(workspacePath: string): AIFileManager {
        if (!AIFileManager.instance) {
            AIFileManager.instance = new AIFileManager(workspacePath);
        }
        return AIFileManager.instance;
    }

    public setModel(model: OpenAiCompatibleModelInfo, provider: ApiProvider) {
        this.currentModel = model;
        this.currentProvider = provider;
    }

    /**
     * Verifica se l'operazione è sicura in base al modello e al contesto
     */
    private async validateOperation(operation: AIFileOperation): Promise<boolean> {
        // Verifica se abbiamo un modello configurato
        if (!this.currentModel || !this.currentProvider) {
            throw new Error('Nessun modello AI configurato');
        }

        // Verifica se il modello è ottimizzato per il codice
        const isCodeOptimized = this.currentModel.id.toLowerCase().includes('coder') || 
                              this.currentProvider === 'deepseek' ||
                              this.currentProvider === 'anthropic'; // Claude è abbastanza capace con il codice

        // Per operazioni di modifica, richiediamo un modello ottimizzato per il codice
        if ((operation.type === 'edit' || operation.type === 'create') && !isCodeOptimized) {
            throw new Error('Questa operazione richiede un modello ottimizzato per il codice');
        }

        // Verifica che ci sia una motivazione per operazioni critiche
        if ((operation.type === 'edit' || operation.type === 'delete') && !operation.reason) {
            throw new Error('È richiesta una motivazione per questa operazione');
        }

        return true;
    }

    /**
     * Legge un file con contesto AI
     */
    public async readFile(filePath: string, reason?: string): Promise<string> {
        await this.validateOperation({
            type: 'read',
            path: filePath,
            reason
        });
        return this.fileManager.readFile(filePath);
    }

    /**
     * Modifica un file con contesto AI
     */
    public async editFile(filePath: string, newContent: string, reason: string): Promise<void> {
        await this.validateOperation({
            type: 'edit',
            path: filePath,
            content: newContent,
            reason
        });
        await this.fileManager.editFile(filePath, newContent);
    }

    /**
     * Crea un nuovo file con contesto AI
     */
    public async createFile(filePath: string, content: string, reason: string): Promise<void> {
        await this.validateOperation({
            type: 'create',
            path: filePath,
            content,
            reason
        });
        await this.fileManager.createFile(filePath, content);
    }

    /**
     * Elimina un file con contesto AI
     */
    public async deleteFile(filePath: string, reason: string): Promise<void> {
        await this.validateOperation({
            type: 'delete',
            path: filePath,
            reason
        });
        await this.fileManager.deleteFile(filePath);
    }

    /**
     * Lista i file in una directory con contesto AI
     */
    public async listFiles(dirPath: string = '.'): Promise<string[]> {
        await this.validateOperation({
            type: 'list',
            path: dirPath
        });
        return this.fileManager.listFiles(dirPath);
    }

    /**
     * Lista ricorsivamente i file con contesto AI
     */
    public async listFilesRecursive(dirPath: string = '.'): Promise<string[]> {
        await this.validateOperation({
            type: 'listRecursive',
            path: dirPath
        });
        return this.fileManager.listFilesRecursive(dirPath);
    }
} 