/**
 * @file JarvisAgent.test.ts
 * @description Test per JarvisAgent
 * @author AI1 | Jarvis MAS v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JarvisAgent } from '../JarvisAgent';
import { SettingsManager } from '../../shared/settings';
import { FileManager } from '../FileManager';
import * as sendPromptModule from '../sendPromptToLLM';

// Mock delle dipendenze
vi.mock('../../shared/settings', () => ({
  SettingsManager: {
    getInstance: vi.fn(() => ({
      loadSettings: vi.fn().mockResolvedValue({
        availableModels: [
          { provider: 'openai', value: 'gpt-4', label: 'GPT-4', coder: true },
          { provider: 'anthropic', value: 'claude-3', label: 'Claude 3', coder: false }
        ],
        provider: 'openai',
        model: 'gpt-4',
        coder_mode: true,
        apiConfiguration: {
          provider: 'openai',
          apiKey: 'test-key',
          baseUrl: 'https://api.example.com'
        }
      }),
      getSystemPrompt: vi.fn().mockResolvedValue('System prompt di test')
    }))
  }
}));

vi.mock('../FileManager', () => ({
  FileManager: {
    readProjectFiles: vi.fn().mockResolvedValue({
      numFiles: 2,
      content: 'File 1: content\nFile 2: content'
    }),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../sendPromptToLLM', () => ({
  sendPromptToLLM: vi.fn().mockResolvedValue({
    action: 'message',
    message: 'Test completato con successo'
  })
}));

// Mock di vscode
vi.mock('vscode', () => ({
  default: {
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/test-workspace' } }]
    },
    window: {
      showTextDocument: vi.fn().mockResolvedValue(undefined),
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue({
        clear: vi.fn(),
        append: vi.fn(),
        show: vi.fn()
      })
    },
    Uri: {
      file: vi.fn(path => ({ fsPath: path }))
    }
  }
}));

describe('JarvisAgent', () => {
  let agent: JarvisAgent;
  
  beforeEach(() => {
    // Resetta lo stato dei mock prima di ogni test
    vi.resetAllMocks();
    
    // Ottieni l'istanza singleton di JarvisAgent
    agent = JarvisAgent.getInstance();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('dovrebbe essere un singleton', () => {
    const instance1 = JarvisAgent.getInstance();
    const instance2 = JarvisAgent.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  it('dovrebbe eseguire un ciclo completo con successo', async () => {
    const sendPromptSpy = vi.spyOn(sendPromptModule, 'sendPromptToLLM');
    const readProjectFilesSpy = vi.spyOn(FileManager, 'readProjectFiles');
    
    const response = await agent.runFullLoop('Prompt utente di test');
    
    // Verifica che i metodi siano stati chiamati correttamente
    expect(readProjectFilesSpy).toHaveBeenCalled();
    expect(sendPromptSpy).toHaveBeenCalled();
    
    // Verifica che il risultato sia corretto
    expect(response).toEqual({
      action: 'message',
      message: 'Test completato con successo'
    });
  });
  
  it('dovrebbe gestire le eccezioni durante l\'esecuzione', async () => {
    // Forza un errore nel metodo sendPromptToLLM
    vi.spyOn(sendPromptModule, 'sendPromptToLLM').mockRejectedValueOnce(new Error('Test error'));
    
    const response = await agent.runFullLoop('Prompt utente di test');
    
    // Verifica che venga restituita una risposta di errore
    expect(response).toEqual({
      action: 'message',
      message: expect.stringContaining('Si è verificato un errore')
    });
  });
}); 