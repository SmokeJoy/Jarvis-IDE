import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vscode } from '../../vitest.setup';

describe('VSCode API Mock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('window', () => {
    it('should show information message', async () => {
      const message = 'Test info message';
      await vscode.window.showInformationMessage(message);
      
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message);
    });

    it('should show error message', async () => {
      const error = 'Test error message';
      await vscode.window.showErrorMessage(error);
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(error);
    });

    it('should create output channel', () => {
      const channelName = 'Test Channel';
      const channel = vscode.window.createOutputChannel(channelName);
      
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith(channelName);
      expect(channel.append).toBeDefined();
      expect(channel.appendLine).toBeDefined();
      expect(channel.clear).toBeDefined();
      expect(channel.show).toBeDefined();
      expect(channel.hide).toBeDefined();
      expect(channel.dispose).toBeDefined();
    });
  });

  describe('workspace', () => {
    it('should read file', async () => {
      const filePath = 'test/file.txt';
      const content = 'test content';
      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(Buffer.from(content));
      
      const result = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      expect(result).toEqual(Buffer.from(content));
    });

    it('should write file', async () => {
      const filePath = 'test/file.txt';
      const content = Buffer.from('test content');
      
      await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), content);
      expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(vscode.Uri.file(filePath), content);
    });

    it('should delete file', async () => {
      const filePath = 'test/file.txt';
      
      await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
      expect(vscode.workspace.fs.delete).toHaveBeenCalledWith(vscode.Uri.file(filePath));
    });

    it('should check if file exists', async () => {
      const filePath = 'test/file.txt';
      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: vscode.FileType.File } as any);
      
      const exists = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      expect(exists.type).toBe(vscode.FileType.File);
    });

    it('should handle workspace folders', () => {
      expect(vscode.workspace.workspaceFolders).toBeDefined();
      expect(Array.isArray(vscode.workspace.workspaceFolders)).toBe(true);
    });
  });

  describe('commands', () => {
    it('should execute command', async () => {
      const command = 'test.command';
      const args = ['arg1', 'arg2'];
      
      await vscode.commands.executeCommand(command, ...args);
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(command, ...args);
    });

    it('should register command', () => {
      const command = 'test.command';
      const callback = vi.fn();
      
      vscode.commands.registerCommand(command, callback);
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback);
    });
  });

  describe('env', () => {
    it('should provide language', () => {
      expect(vscode.env.language).toBe('en');
    });

    it('should provide machine id', () => {
      expect(vscode.env.machineId).toBeDefined();
    });

    it('should provide session id', () => {
      expect(vscode.env.sessionId).toBeDefined();
    });
  });

  describe('Uri', () => {
    it('should create file uri', () => {
      const path = 'test/file.txt';
      const uri = vscode.Uri.file(path);
      
      expect(uri.scheme).toBe('file');
      expect(uri.path).toBe(path);
    });

    it('should parse uri', () => {
      const uriString = 'file:///test/file.txt';
      const uri = vscode.Uri.parse(uriString);
      
      expect(uri.scheme).toBe('file');
      expect(uri.path).toBe('/test/file.txt');
    });
  });
}); 
 