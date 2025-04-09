import type { ApiConfiguration } from "./types/api.types.js.js"
import type { TelemetrySetting } from './types.js.js';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LLMProviderId } from '../types/global.js.js';
import type { Settings, AvailableModel } from './types/settings.types.js.js';

export class SettingsManager {
  private static instance: SettingsManager;
  private settingsPath: string;
  private defaultSystemPromptPath: string;

  private constructor() {
    const configDir = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', 'config');
    this.settingsPath = path.join(configDir, 'settings.json');
    this.defaultSystemPromptPath = path.join(configDir, 'system_prompt.md');
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  public async saveSettings(settings: Settings): Promise<void> {
    try {
      const configDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      await fs.promises.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  public async loadSettings(): Promise<Settings | null> {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return null;
      }

      const data = await fs.promises.readFile(this.settingsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  public async resetSettings(): Promise<Settings> {
    const defaultSettings: Settings = {
      apiConfiguration: {
        provider: 'openai',
        customInstructions: '',
      },
      telemetrySetting: { enabled: true },
      customInstructions: '',
      planActSeparateModelsSetting: false,
      use_docs: false,
      contextPrompt: '',
      coder_mode: true,
      systemPromptPath: '',
      provider: 'openai',
      model: '',
      availableModels: [
        { label: "DeepSeek Coder (Local)", value: "deepseek-coder", provider: "local", coder: true },
        { label: "OpenRouter Mistral", value: "openrouter-mistral", provider: "openrouter", coder: false },
        { label: "Gemini 1.5", value: "gemini", provider: "google", coder: false }
      ]
    };

    await this.saveSettings(defaultSettings);
    return defaultSettings;
  }

  public async addModel(model: AvailableModel): Promise<void> {
    try {
      const settings = await this.loadSettings() || await this.resetSettings();
      const updatedModels = [...(settings.availableModels || []), model];
      settings.availableModels = updatedModels;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error adding model:', error);
      throw error;
    }
  }

  public async exportToFile(targetPath: string): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings) {
        throw new Error('Nessuna impostazione trovata da esportare');
      }

      await fs.promises.writeFile(
        targetPath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  public async importFromFile(sourcePath: string): Promise<void> {
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error('File di importazione non trovato');
      }

      const data = await fs.promises.readFile(sourcePath, 'utf-8');
      const settings = JSON.parse(data) as Settings;

      // Validazione base delle impostazioni importate
      if (!this.validateSettings(settings)) {
        throw new Error('File di impostazioni non valido');
      }

      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  public async getSystemPromptPath(): Promise<string> {
    try {
      const settings = await this.loadSettings();
      // Usa il percorso personalizzato se presente, altrimenti usa quello predefinito
      if (settings && settings.systemPromptPath) {
        // Se è un percorso relativo, lo rende assoluto
        if (!path.isAbsolute(settings.systemPromptPath)) {
          return path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', settings.systemPromptPath);
        }
        return settings.systemPromptPath;
      }
      return this.defaultSystemPromptPath;
    } catch (error) {
      console.error('Error getting system prompt path:', error);
      return this.defaultSystemPromptPath;
    }
  }

  public async setSystemPromptPath(customPath: string): Promise<void> {
    try {
      const settings = await this.loadSettings() || await this.resetSettings();
      settings.systemPromptPath = customPath;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error setting system prompt path:', error);
      throw error;
    }
  }

  public async openSystemPromptFile(): Promise<void> {
    try {
      const systemPromptPath = await this.getSystemPromptPath();
      
      // Verifica se il file esiste, altrimenti lo crea con contenuto vuoto
      if (!fs.existsSync(systemPromptPath)) {
        const dirPath = path.dirname(systemPromptPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        await fs.promises.writeFile(systemPromptPath, '', 'utf-8');
      }
      
      // Apre il file in VS Code
      const document = await vscode.workspace.openTextDocument(systemPromptPath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      console.error('Error opening system prompt file:', error);
      vscode.window.showErrorMessage(`Errore nell'apertura del file: ${error}`);
    }
  }
  
  public async getSystemPrompt(): Promise<string> {
    try {
      const systemPromptPath = await this.getSystemPromptPath();
      if (!fs.existsSync(systemPromptPath)) {
        return '';
      }
      return await fs.promises.readFile(systemPromptPath, 'utf-8');
    } catch (error) {
      console.error('Error reading system prompt:', error);
      return '';
    }
  }

  public async saveSystemPrompt(content: string): Promise<void> {
    try {
      const systemPromptPath = await this.getSystemPromptPath();
      const configDir = path.dirname(systemPromptPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      await fs.promises.writeFile(systemPromptPath, content, 'utf-8');
    } catch (error) {
      console.error('Error saving system prompt:', error);
      throw error;
    }
  }

  public async updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    try {
      const settings = await this.loadSettings() || await this.resetSettings();
      settings[key] = value;
      await this.saveSettings(settings);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  private validateSettings(settings: any): settings is Settings {
    return (
      settings &&
      typeof settings === 'object' &&
      'apiConfiguration' in settings &&
      'telemetrySetting' in settings &&
      'customInstructions' in settings &&
      'planActSeparateModelsSetting' in settings &&
      'use_docs' in settings &&
      'contextPrompt' in settings &&
      'coder_mode' in settings &&
      'systemPromptPath' in settings &&
      'provider' in settings &&
      'model' in settings &&
      typeof settings.apiConfiguration === 'object' &&
      typeof settings.telemetrySetting === 'object' &&
      typeof settings.customInstructions === 'string' &&
      typeof settings.planActSeparateModelsSetting === 'boolean' &&
      typeof settings.use_docs === 'boolean' &&
      typeof settings.contextPrompt === 'string' &&
      typeof settings.coder_mode === 'boolean' &&
      typeof settings.systemPromptPath === 'string' &&
      typeof settings.provider === 'string' &&
      typeof settings.model === 'string'
    );
  }
} 