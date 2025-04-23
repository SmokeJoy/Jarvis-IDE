import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '../../utils/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Resetta tutti i mock prima di ogni test
    vi.clearAllMocks();
    
    // Spia sui metodi della console
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  describe('instance management', () => {
    it('should create a singleton instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    it('should initialize with the correct context', () => {
      const logger = Logger.getInstance();
      expect(logger).toHaveProperty('context', 'Jarvis-IDE');
    });
  });

  describe('logging methods', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = Logger.getInstance();
    });

    it('should log messages with correct prefix', () => {
      logger.log('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'test message');
    });

    it('should handle error logging', () => {
      const error = new Error('test error');
      logger.error('error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'error occurred', error);
    });

    it('should handle warning messages', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'warning message');
    });

    it('should handle info messages', () => {
      logger.info('info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'info message');
    });

    it('should handle debug messages', () => {
      logger.debug('debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'debug message');
    });

    it('should handle multiple arguments', () => {
      const obj = { key: 'value' };
      logger.log('message', 123, obj);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'message', 123, obj);
    });
  });

  describe('error handling', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = Logger.getInstance();
    });

    it('should handle undefined messages', () => {
      logger.log(undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Jarvis-IDE]', undefined);
    });

    it('should handle null messages', () => {
      logger.log(null);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Jarvis-IDE]', null);
    });

    it('should handle circular references', () => {
      const circular: any = {};
      circular.self = circular;
      logger.log('circular object', circular);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Jarvis-IDE]', 'circular object', circular);
    });
  });

  describe('context handling', () => {
    it('should allow changing context', () => {
      const logger = Logger.getInstance();
      logger.setContext('NewContext');
      logger.log('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('[NewContext]', 'test');
    });

    it('should handle empty context', () => {
      const logger = Logger.getInstance();
      logger.setContext('');
      logger.log('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('[]', 'test');
    });
  });
}); 