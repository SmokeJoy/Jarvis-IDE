import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { directoryScanner } from './directoryScanner.js';

// Interfaccia per il risultato della scansione
interface DirectoryScanResult {
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryScanResult[];
}

// Mock del modulo fs/promises
jest.mock('fs/promises', () => ({
  readdir: jest.fn()
}));

// Mock del modulo path
jest.mock('path', () => ({
  join: jest.fn((dir, file) => `${dir}/${file}`)
}));

describe('directoryScanner', () => {
  // Resetta tutti i mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe scansionare una directory con successo', async () => {
    // Arrange
    const args = { 
      path: '/test/directory' 
    };
    
    const mockEntries = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'file2.js', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true }
    ];
    
    // Mock di readdir per il primo livello
    (fs.readdir as jest.Mock).mockImplementation((dirPath, options) => {
      if (dirPath === '/test/directory') {
        return Promise.resolve(mockEntries);
      } else if (dirPath === '/test/directory/subdir') {
        return Promise.resolve([
          { name: 'subfile.txt', isDirectory: () => false }
        ]);
      }
      return Promise.resolve([]);
    });

    // Act
    const result = await directoryScanner(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data?.find((item: DirectoryScanResult) => item.path === '/test/directory/subdir')?.type).toBe('directory');
    expect(result.data?.find((item: DirectoryScanResult) => item.path === '/test/directory/file1.txt')?.type).toBe('file');
    expect(fs.readdir).toHaveBeenCalledTimes(2);
  });

  it('dovrebbe rispettare maxDepth', async () => {
    // Arrange
    const args = { 
      path: '/test/directory',
      maxDepth: 1 // Solo primo livello
    };
    
    const mockEntries = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true }
    ];
    
    (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);

    // Act
    const result = await directoryScanner(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    
    const subdir = result.data?.find((item: DirectoryScanResult) => item.path === '/test/directory/subdir');
    expect(subdir).toBeDefined();
    expect(subdir?.type).toBe('directory');
    expect(subdir?.children).toHaveLength(0); // Non dovrebbe avere figli con maxDepth=1
    
    // readdir dovrebbe essere chiamata solo una volta perché maxDepth=1
    expect(fs.readdir).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe escludere directory basate sul pattern', async () => {
    // Arrange
    const args = { 
      path: '/test/directory',
      exclude: ['node_modules', 'tmp'] 
    };
    
    const mockEntries = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'node_modules', isDirectory: () => true },
      { name: 'tmp', isDirectory: () => true },
      { name: 'src', isDirectory: () => true }
    ];
    
    (fs.readdir as jest.Mock).mockImplementation((dirPath, options) => {
      if (dirPath === '/test/directory') {
        return Promise.resolve(mockEntries);
      } else if (dirPath === '/test/directory/src') {
        return Promise.resolve([
          { name: 'app.js', isDirectory: () => false }
        ]);
      }
      return Promise.resolve([]);
    });

    // Act
    const result = await directoryScanner(args);

    // Assert
    expect(result.success).toBe(true);
    
    // Solo file1.txt e src dovrebbero essere inclusi
    expect(result.data).toHaveLength(2);
    
    // Verifica che node_modules e tmp siano stati esclusi
    const paths = result.data?.map((item: DirectoryScanResult) => item.path);
    expect(paths).not.toContain('/test/directory/node_modules');
    expect(paths).not.toContain('/test/directory/tmp');
    expect(paths).toContain('/test/directory/file1.txt');
    expect(paths).toContain('/test/directory/src');
  });

  it('dovrebbe gestire errori durante la scansione', async () => {
    // Arrange
    const args = { 
      path: '/test/non-esistente' 
    };
    
    (fs.readdir as jest.Mock).mockRejectedValue(new Error('Directory non trovata'));

    // Act
    const result = await directoryScanner(args);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Failed to scan directory/);
  });

  it('dovrebbe utilizzare i valori di default quando non specificati', async () => {
    // Arrange
    const args = { 
      path: '/test/directory' 
    };
    
    const mockEntries = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: '.git', isDirectory: () => true },
      { name: 'node_modules', isDirectory: () => true },
      { name: 'src', isDirectory: () => true }
    ];
    
    (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);

    // Act
    const result = await directoryScanner(args);

    // Assert
    expect(result.success).toBe(true);
    
    // Solo file1.txt e src dovrebbero essere inclusi (esclusione default di .git e node_modules)
    expect(result.data).toHaveLength(2);
    expect(result.data?.map((item: DirectoryScanResult) => item.path)).toContain('/test/directory/file1.txt');
    expect(result.data?.map((item: DirectoryScanResult) => item.path)).toContain('/test/directory/src');
  });
}); 