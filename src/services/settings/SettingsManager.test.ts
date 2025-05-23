import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { SettingsManager, JarvisSettings } from './SettingsManager.js';
import { afterEach, beforeEach, describe, expect, it, jest, test } from '@jest/globals';

// Mock di vscode
jest.mock('vscode', () => ({
  ExtensionContext: class {
    globalStorageUri = { fsPath: '/test/global/storage' };
  },
}));

// Mock di fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockImplementation((path: string) => {
    if (path.includes('settings.json')) {
      return Promise.resolve(JSON.stringify({
        use_docs: true,
        coder_mode: false,
        contextPrompt: 'Test prompt',
        selectedModel: 'test-model',
        multi_agent: true
      }));
    } else if (path.includes('system_prompt.md')) {
      return Promise.resolve('# Test System Prompt');
    }
    return Promise.reject(new Error('File not found'));
  }),
}));

describe('SettingsManager', () => {
  let settingsManager: SettingsManager;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    // Resetta i mock prima di ogni test
    jest.clearAllMocks();
    
    // Crea un context mock
    mockContext = new (vscode.ExtensionContext as any)();
    
    // Inizializza il SettingsManager con il context mock
    settingsManager = SettingsManager.getInstance(mockContext);
  });

  test('loadSettings dovrebbe caricare correttamente le impostazioni da disk', async () => {
    const settings = await settingsManager.loadSettings();
    
    // Verifica che readFile sia stato chiamato con il percorso corretto
    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(mockContext.globalStorageUri.fsPath, 'config', 'settings.json'),
      'utf8'
    );
    
    // Verifica che le impostazioni siano state caricate correttamente
    expect(settings).toEqual({
      use_docs: true,
      coder_mode: false,
      contextPrompt: 'Test prompt',
      selectedModel: 'test-model',
      multi_agent: true
    });
  });

  test('saveSettings dovrebbe salvare correttamente le impostazioni su disk', async () => {
    const testSettings: JarvisSettings = {
      use_docs: false,
      coder_mode: true,
      contextPrompt: 'New test prompt',
      selectedModel: 'new-test-model',
      multi_agent: false
    };
    
    // Imposta le impostazioni
    settingsManager['settings'] = testSettings;
    
    // Salva le impostazioni
    await settingsManager.saveSettings();
    
    // Verifica che mkdir sia stato chiamato
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join(mockContext.globalStorageUri.fsPath, 'config'),
      { recursive: true }
    );
    
    // Verifica che writeFile sia stato chiamato con i parametri corretti
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(mockContext.globalStorageUri.fsPath, 'config', 'settings.json'),
      JSON.stringify(testSettings, null, 2),
      'utf8'
    );
  });

  test('updateSetting dovrebbe aggiornare una singola impostazione', async () => {
    // Aggiorna un'impostazione
    await settingsManager.updateSetting('multi_agent', true);
    
    // Verifica che l'impostazione sia stata aggiornata in memoria
    expect(settingsManager.getSettings().multi_agent).toBe(true);
    
    // Verifica che le impostazioni siano state salvate su disco
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('loadSystemPrompt dovrebbe caricare correttamente il system prompt da disk', async () => {
    const prompt = await settingsManager.loadSystemPrompt();
    
    // Verifica che readFile sia stato chiamato con il percorso corretto
    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(mockContext.globalStorageUri.fsPath, 'config/system_prompt.md'),
      'utf-8'
    );
    
    // Verifica che il prompt sia stato caricato correttamente
    expect(prompt).toBe('# Test System Prompt');
  });

  test('saveSystemPrompt dovrebbe salvare correttamente il system prompt su disk', async () => {
    const testPrompt = '# New Test System Prompt';
    
    // Salva il prompt
    await settingsManager.saveSystemPrompt(testPrompt);
    
    // Verifica che mkdir sia stato chiamato
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.dirname(path.join(mockContext.globalStorageUri.fsPath, 'config/system_prompt.md')),
      { recursive: true }
    );
    
    // Verifica che writeFile sia stato chiamato con i parametri corretti
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(mockContext.globalStorageUri.fsPath, 'config/system_prompt.md'),
      testPrompt,
      'utf-8'
    );
  });

  test('resetSettings dovrebbe reimpostare le impostazioni ai valori di default', async () => {
    // Resetta le impostazioni
    await settingsManager.resetSettings();
    
    // Verifica che le impostazioni siano state ripristinate
    const settings = settingsManager.getSettings();
    expect(settings.use_docs).toBe(false);
    expect(settings.coder_mode).toBe(true);
    expect(settings.contextPrompt).toBe('');
    expect(settings.selectedModel).toBe('');
    expect(settings.multi_agent).toBe(false);
    
    // Verifica che le impostazioni siano state salvate su disco
    expect(fs.writeFile).toHaveBeenCalled();
  });
}); 