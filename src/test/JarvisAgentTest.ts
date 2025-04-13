/**
 * Test per JarvisAgent
 * Questo file verifica le funzionalità di base dell'agente autonomo
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { JarvisAgent, AgentResponse } from '../agent/JarvisAgent';

// Mock delle dipendenze esterne
vi.mock('../utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../agent/sendPromptToLLM', () => ({
  sendPromptToLLM: vi.fn().mockResolvedValue({
    action: 'saveFile',
    path: 'src/test/generato-da-test.ts',
    content: '// File generato dal test',
  }),
}));

vi.mock('../shared/settings', () => ({
  SettingsManager: {
    getInstance: vi.fn().mockReturnValue({
      loadSettings: vi.fn().mockResolvedValue({
        apiConfiguration: {
          provider: 'local',
          model: 'test-model',
        },
        coder_mode: true,
      }),
      getSystemPrompt: vi.fn().mockResolvedValue('System prompt di test'),
    }),
  },
}));

vi.mock('../agent/FileManager', () => ({
  FileManager: {
    readProjectFiles: vi.fn().mockResolvedValue({
      content: '// Contenuto di test',
      numFiles: 5,
      fileList: ['file1.ts', 'file2.ts'],
    }),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

// Per evitare dipendenze da vscode in test
vi.mock('vscode', () => ({
  window: {
    showTextDocument: vi.fn(),
    createOutputChannel: vi.fn().mockReturnValue({
      clear: vi.fn(),
      append: vi.fn(),
      show: vi.fn(),
    }),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' },
      },
    ],
  },
  commands: {
    executeCommand: vi.fn(),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
}));

describe('JarvisAgent', () => {
  let agent: JarvisAgent;
  let tempFilePath: string;

  beforeEach(() => {
    agent = JarvisAgent.getInstance();
    tempFilePath = path.join(process.cwd(), 'src/test/generato-da-test.ts');

    // Pulisci i mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Rimuovi eventuali file temporanei creati dai test
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Errore nella pulizia dei file temporanei:', e);
      }
    }
  });

  it('dovrebbe eseguire correttamente un ciclo completo', async () => {
    const result = await agent.runFullLoop('Test prompt');

    expect(result).toBeDefined();
    expect(result.action).toBe('saveFile');
    expect(result.path).toBe('src/test/generato-da-test.ts');
  });

  it('dovrebbe gestire correttamente gli errori', async () => {
    // Modifica il mock per simulare un errore
    const sendPromptToLLMMock = await import('../agent/sendPromptToLLM');
    vi.mocked(sendPromptToLLMMock.sendPromptToLLM).mockRejectedValueOnce(
      new Error('Errore di test')
    );

    const result = await agent.runFullLoop('Test prompt con errore');

    expect(result).toBeDefined();
    expect(result.action).toBe('message');
    expect(result.message).toContain('errore');
  });
});
