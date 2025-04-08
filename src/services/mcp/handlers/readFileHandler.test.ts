import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readFileHandler } from './readFileHandler.js';
import type { ReadFileArgs } from '../mcp.types.js';

// Mock del modulo fs/promises
jest.mock('fs/promises', () => ({
  stat: jest.fn(),
  readFile: jest.fn()
}));

// Mock del modulo path
jest.mock('path', () => ({
  normalize: jest.fn((p) => p),
  isAbsolute: jest.fn(),
  join: jest.fn((base, file) => `${base}/${file}`)
}));

// Mock di VSCode
jest.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: '/workspace/root'
        }
      }
    ]
  }
}), { virtual: true });

describe('readFileHandler', () => {
  // Resetta tutti i mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe restituire errore se filePath è assente', async () => {
    // Arrange
    const args: ReadFileArgs = { filePath: '' };

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/non specificato/i);
  });

  it('dovrebbe gestire correttamente i percorsi assoluti', async () => {
    // Arrange
    const args: ReadFileArgs = { filePath: '/path/to/file.txt' };
    const mockStats = { isFile: jest.fn().mockReturnValue(true) };
    
    (path.isAbsolute as jest.Mock).mockReturnValue(true);
    (fs.stat as jest.Mock).mockResolvedValue(mockStats);
    (fs.readFile as jest.Mock).mockResolvedValue('contenuto file');

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(path.isAbsolute).toHaveBeenCalledWith('/path/to/file.txt');
    expect(fs.stat).toHaveBeenCalledWith('/path/to/file.txt');
    expect(fs.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
    expect(result.success).toBe(true);
    expect(result.data).toBe('contenuto file');
  });

  it('dovrebbe gestire correttamente i percorsi relativi', async () => {
    // Arrange
    const args: ReadFileArgs = { filePath: 'path/to/file.txt' };
    const mockStats = { isFile: jest.fn().mockReturnValue(true) };
    
    (path.isAbsolute as jest.Mock).mockReturnValue(false);
    (fs.stat as jest.Mock).mockResolvedValue(mockStats);
    (fs.readFile as jest.Mock).mockResolvedValue('contenuto file');

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(path.isAbsolute).toHaveBeenCalledWith('path/to/file.txt');
    expect(path.join).toHaveBeenCalledWith('/workspace/root', 'path/to/file.txt');
    expect(fs.stat).toHaveBeenCalledWith('/workspace/root/path/to/file.txt');
    expect(fs.readFile).toHaveBeenCalledWith('/workspace/root/path/to/file.txt', 'utf-8');
    expect(result.success).toBe(true);
    expect(result.data).toBe('contenuto file');
  });

  it('dovrebbe gestire encoding personalizzato', async () => {
    // Arrange
    const args: ReadFileArgs = { 
      filePath: '/path/to/file.txt',
      encoding: 'latin1'
    };
    const mockStats = { isFile: jest.fn().mockReturnValue(true) };
    
    (path.isAbsolute as jest.Mock).mockReturnValue(true);
    (fs.stat as jest.Mock).mockResolvedValue(mockStats);
    (fs.readFile as jest.Mock).mockResolvedValue('contenuto file');

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(fs.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'latin1');
    expect(result.success).toBe(true);
    expect(result.data).toBe('contenuto file');
  });

  it('dovrebbe restituire errore se il percorso non è un file', async () => {
    // Arrange
    const args: ReadFileArgs = { filePath: '/path/to/directory' };
    const mockStats = { isFile: jest.fn().mockReturnValue(false) };
    
    (path.isAbsolute as jest.Mock).mockReturnValue(true);
    (fs.stat as jest.Mock).mockResolvedValue(mockStats);

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(fs.stat).toHaveBeenCalledWith('/path/to/directory');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/non è un file/i);
  });

  it('dovrebbe gestire errori durante la lettura del file', async () => {
    // Arrange
    const args: ReadFileArgs = { filePath: '/path/to/file.txt' };
    const mockStats = { isFile: jest.fn().mockReturnValue(true) };
    
    (path.isAbsolute as jest.Mock).mockReturnValue(true);
    (fs.stat as jest.Mock).mockResolvedValue(mockStats);
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('Errore di lettura'));

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Errore durante la lettura del file/i);
    expect(result.message).toMatch(/Errore di lettura/i);
  });

  it('dovrebbe gestire errori durante la verifica del percorso', async () => {
    // Arrange
    const args: ReadFileArgs = { filePath: '/path/inesistente/file.txt' };
    
    (path.isAbsolute as jest.Mock).mockReturnValue(true);
    (fs.stat as jest.Mock).mockRejectedValue(new Error('File non trovato'));

    // Act
    const result = await readFileHandler(args);

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Errore durante la lettura del file/i);
    expect(result.message).toMatch(/File non trovato/i);
  });
}); 