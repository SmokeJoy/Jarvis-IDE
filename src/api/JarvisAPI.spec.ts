import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JarvisAPI } from './JarvisAPI';
import { LLMProviderId } from '@shared/types/api.types';
import { fetchOpenAIModels, sendOpenAIMessage } from '../providers/openai/openai-provider';

// Mock dei moduli
vi.mock('../providers/openai/openaiProvider', () => ({
  fetchOpenAIModels: vi.fn(),
  sendOpenAIMessage: vi.fn()
}));

describe('JarvisAPI', () => {
  let api: JarvisAPI;
  const mockApiKey = 'test-api-key';
  const mockOrgId = 'test-org-id';

  beforeEach(() => {
    api = JarvisAPI.getInstance();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = JarvisAPI.getInstance();
      const instance2 = JarvisAPI.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('setConfiguration', () => {
    it('should update configuration', async () => {
      const config = {
        provider: LLMProviderId.Anthropic,
        modelId: 'claude-3',
        temperature: 0.8
      };

      const result = await api.setConfiguration(config);
      expect(result.success).toBe(true);

      const currentConfig = await api.getConfiguration();
      expect(currentConfig.success).toBe(true);
      expect(currentConfig.data).toMatchObject(config);
    });

    it('should handle errors', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      vi.spyOn(Object, 'assign').mockImplementation(() => { throw error; });

      const result = await api.setConfiguration({});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('getConfiguration', () => {
    it('should return current configuration', async () => {
      const result = await api.getConfiguration();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        provider: LLMProviderId.OpenAI,
        modelId: 'gpt-4'
      });
    });

    it('should handle errors', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      vi.spyOn(Object, 'create').mockImplementation(() => { throw error; });

      const result = await api.getConfiguration();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('loadModels', () => {
    it('should load OpenAI models when provider is OpenAI', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: LLMProviderId.OpenAI },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: LLMProviderId.OpenAI }
      ];

      (fetchOpenAIModels as any).mockResolvedValueOnce(mockModels);

      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: mockApiKey,
        organizationId: mockOrgId
      });

      const result = await api.loadModels();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModels);
      expect(fetchOpenAIModels).toHaveBeenCalledWith(mockApiKey, mockOrgId);
    });

    it('should handle missing API key', async () => {
      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: ''
      });

      const result = await api.loadModels();
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key non fornita');
    });

    it('should handle OpenAI API errors', async () => {
      const error = new Error('OpenAI API error');
      (fetchOpenAIModels as any).mockRejectedValueOnce(error);

      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: mockApiKey
      });

      const result = await api.loadModels();
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenAI API error');
    });
  });

  describe('sendMessage', () => {
    it('should send message to OpenAI when provider is OpenAI', async () => {
      const mockMessage = 'Hello, AI!';
      const mockModelId = 'gpt-4';
      const mockStream = new ReadableStream();

      (sendOpenAIMessage as any).mockResolvedValueOnce(mockStream);

      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: mockApiKey,
        organizationId: mockOrgId,
        modelId: mockModelId,
        temperature: 0.7,
        maxTokens: 4000
      });

      const result = await api.sendMessage(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockStream);
      expect(sendOpenAIMessage).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        organizationId: mockOrgId,
        model: mockModelId,
        messages: [{ role: 'user', content: mockMessage }],
        temperature: 0.7,
        maxTokens: '4000'
      });
    });

    it('should handle missing API key', async () => {
      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: ''
      });

      const result = await api.sendMessage('test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key non fornita');
    });

    it('should handle missing model ID', async () => {
      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: mockApiKey,
        modelId: ''
      });

      const result = await api.sendMessage('test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Model ID non fornito');
    });

    it('should handle OpenAI API errors', async () => {
      const error = new Error('OpenAI API error');
      (sendOpenAIMessage as any).mockRejectedValueOnce(error);

      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: mockApiKey,
        modelId: 'gpt-4'
      });

      const result = await api.sendMessage('test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenAI API error');
    });
  });

  describe('reset', () => {
    it('should reset configuration to defaults', async () => {
      // First change configuration
      await api.setConfiguration({
        provider: LLMProviderId.Anthropic,
        modelId: 'claude-3'
      });

      // Then reset
      const resetResult = await api.reset();
      expect(resetResult.success).toBe(true);

      // Verify reset
      const config = await api.getConfiguration();
      expect(config.success).toBe(true);
      expect(config.data).toMatchObject({
        provider: LLMProviderId.OpenAI,
        modelId: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000
      });
    });

    it('should handle errors', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      vi.spyOn(Object, 'assign').mockImplementation(() => { throw error; });

      const result = await api.reset();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
}); 
 