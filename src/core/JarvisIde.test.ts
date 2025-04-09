import { JarvisIde } from './JarvisIde.js.js';
import type { ApiConfiguration } from '../types/provider.types.js.js';

describe('JarvisIde', () => {
  let jarvisIde: JarvisIde;
  const mockConfig: ApiConfiguration = {
    apiKey: 'test-key',
    baseUrl: 'https://api.jarvis-ide.com',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 1000,
    contextWindow: 4096,
    pricePer1kTokens: 0.002,
    capabilities: ['chat', 'code', 'search']
  };

  beforeEach(() => {
    jarvisIde = new JarvisIde(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(jarvisIde.config).toEqual(mockConfig);
    });

    it('should throw error if apiKey is missing', () => {
      expect(() => new JarvisIde({ ...mockConfig, apiKey: '' })).toThrow();
    });

    it('should throw error if baseUrl is missing', () => {
      expect(() => new JarvisIde({ ...mockConfig, baseUrl: '' })).toThrow();
    });
  });

  describe('chat', () => {
    it('should send chat message and receive response', async () => {
      const mockResponse = {
        content: 'Test response',
        tokensIn: 10,
        tokensOut: 20,
        cost: 0.02
      };

      jest.spyOn(jarvisIde, 'sendRequest').mockResolvedValue(mockResponse);

      const response = await jarvisIde.chat('Test message');
      expect(response).toEqual(mockResponse);
    });

    it('should handle chat errors', async () => {
      jest.spyOn(jarvisIde, 'sendRequest').mockRejectedValue(new Error('API Error'));

      await expect(jarvisIde.chat('Test message')).rejects.toThrow('API Error');
    });
  });

  describe('code', () => {
    it('should send code request and receive response', async () => {
      const mockResponse = {
        content: 'function test() { return true; }',
        tokensIn: 15,
        tokensOut: 30,
        cost: 0.03
      };

      jest.spyOn(jarvisIde, 'sendRequest').mockResolvedValue(mockResponse);

      const response = await jarvisIde.code('Write a test function');
      expect(response).toEqual(mockResponse);
    });

    it('should handle code errors', async () => {
      jest.spyOn(jarvisIde, 'sendRequest').mockRejectedValue(new Error('API Error'));

      await expect(jarvisIde.code('Write a test function')).rejects.toThrow('API Error');
    });
  });

  describe('search', () => {
    it('should send search request and receive response', async () => {
      const mockResponse = {
        content: 'Search results',
        tokensIn: 5,
        tokensOut: 10,
        cost: 0.01
      };

      jest.spyOn(jarvisIde, 'sendRequest').mockResolvedValue(mockResponse);

      const response = await jarvisIde.search('Test query');
      expect(response).toEqual(mockResponse);
    });

    it('should handle search errors', async () => {
      jest.spyOn(jarvisIde, 'sendRequest').mockRejectedValue(new Error('API Error'));

      await expect(jarvisIde.search('Test query')).rejects.toThrow('API Error');
    });
  });
}); 