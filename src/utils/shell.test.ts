import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { getShellFromEnv } from './shell';

describe('Shell Utilities', () => {
  describe('getShellFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset modules and create a clean copy of process.env before each test
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original process.env after each test
      process.env = originalEnv;
    });

    test('restituisce SHELL se definito (macOS/Linux)', () => {
      // Simulate macOS/Linux environment
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env['SHELL'] = '/bin/zsh';
      expect(getShellFromEnv()).toBe('/bin/zsh');
    });

    test('restituisce COMSPEC se definito (Windows)', () => {
      // Simulate Windows environment
      Object.defineProperty(process, 'platform', { value: 'win32' });
      delete process.env['SHELL'];
      process.env['COMSPEC'] = 'C:\\Windows\\System32\\cmd.exe';
      expect(getShellFromEnv()).toBe('C:\\Windows\\System32\\cmd.exe');
    });

    test('restituisce il valore di fallback per macOS se SHELL non è definito', () => {
      // Simulate macOS environment without SHELL
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      delete process.env['SHELL'];
      expect(getShellFromEnv()).toBe('/bin/zsh');
    });

    test('restituisce il valore di fallback per Windows se COMSPEC non è definito', () => {
      // Simulate Windows environment without COMSPEC
      Object.defineProperty(process, 'platform', { value: 'win32' });
      delete process.env['COMSPEC'];
      expect(getShellFromEnv()).toBe('C:\\Windows\\System32\\cmd.exe');
    });

    test('restituisce SHELL se definito (Linux)', () => {
      // Simulate Linux environment
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env['SHELL'] = '/bin/bash';
      expect(getShellFromEnv()).toBe('/bin/bash');
    });

    test('restituisce COMSPEC se SHELL non è definito (Linux)', () => {
      // Simulate Linux environment without SHELL but with COMSPEC
      Object.defineProperty(process, 'platform', { value: 'linux' });
      delete process.env['SHELL'];
      process.env['COMSPEC'] = '/custom/shell';
      expect(getShellFromEnv()).toBe('/custom/shell');
    });

    test('restituisce il valore di fallback per Linux se né SHELL né COMSPEC sono definiti', () => {
      // Simulate Linux environment without SHELL or COMSPEC
      Object.defineProperty(process, 'platform', { value: 'linux' });
      delete process.env['SHELL'];
      delete process.env['COMSPEC'];
      expect(getShellFromEnv()).toBe('/bin/bash');
    });

    test('restituisce null per piattaforme non supportate', () => {
      // Simulate an unsupported platform
      Object.defineProperty(process, 'platform', { value: 'solaris' });
      expect(getShellFromEnv()).toBeNull();
    });
  });
});
