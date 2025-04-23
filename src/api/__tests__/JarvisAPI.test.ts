import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JarvisAPI } from '../JarvisAPI';
import { LLMProviderId, type APIConfiguration } from '@shared/types/api.types';
import { ApiMessageType } from '@shared/messages/api-messages';
import { fetchOpenAIModels, sendOpenAIMessage } from '../providers/openai/openai-provider';

// Mock the OpenAI provider
vi.mock('../providers/openai/openai-provider', () => ({
  fetchOpenAIModels: vi.fn().mockResolvedValue([
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ]),
  sendOpenAIMessage: vi.fn().mockResolvedValue(new ReadableStream())
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    debug: vi.fn(),
    error: vi.fn()
  }))
}));

describe('JarvisAPI', () => {
  let api: JarvisAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    api = JarvisAPI.getInstance();
  });

  afterEach(() => {
    api.dispose();
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
      const config: Partial<APIConfiguration> = {
        provider: LLMProviderId.OpenAI,
        apiKey: 'test-key',
        modelId: 'gpt-4',
        temperature: 0.8,
        maxTokens: 2000
      };

      const response = await api.setConfiguration(config);
      expect(response.success).toBe(true);

      const getConfigResponse = await api.getConfiguration();
      expect(getConfigResponse.data).toEqual(expect.objectContaining(config));
    });

    it('should handle invalid configuration', async () => {
      const response = await api.setConfiguration(null as any);
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });
  });

  describe('loadModels', () => {
    it('should load models for OpenAI provider', async () => {
      await api.setConfiguration({ provider: LLMProviderId.OpenAI, apiKey: 'test-key' });
      const response = await api.loadModels();
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String)
        })
      ]));
      expect(fetchOpenAIModels).toHaveBeenCalledWith('test-key', undefined);
    });

    it('should handle missing API key', async () => {
      const response = await api.loadModels();
      expect(response.success).toBe(false);
      expect(response.error).toBe('API key non fornita');
    });

    it('should handle unsupported providers', async () => {
      await api.setConfiguration({ provider: 'unsupported' as LLMProviderId });
      const response = await api.loadModels('test-key');
      expect(response.success).toBe(false);
      expect(response.error).toContain('Provider');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: 'test-key',
        modelId: 'gpt-4'
      });

      const response = await api.sendMessage('Hello');
      expect(response.success).toBe(true);
      expect(response.data).toBeInstanceOf(ReadableStream);
      expect(sendOpenAIMessage).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'test-key',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }]
      }));
    });

    it('should handle missing API key', async () => {
      const response = await api.sendMessage('Hello');
      expect(response.success).toBe(false);
      expect(response.error).toBe('API key non fornita');
    });

    it('should handle missing model ID', async () => {
      await api.setConfiguration({ apiKey: 'test-key', modelId: '' });
      const response = await api.sendMessage('Hello');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Model ID non fornito');
    });

    it('should handle provider errors', async () => {
      vi.mocked(sendOpenAIMessage).mockRejectedValueOnce(new Error('API Error'));
      
      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: 'test-key',
        modelId: 'gpt-4'
      });

      const response = await api.sendMessage('Hello');
      expect(response.success).toBe(false);
      expect(response.error).toBe('API Error');
    });
  });

  describe('message handlers', () => {
    it('should register and call message handlers', () => {
      const handler = vi.fn();
      const message = { type: ApiMessageType.SEND_MESSAGE, payload: { message: 'test' } };

      api.on(ApiMessageType.SEND_MESSAGE, handler);
      api.handleMessage(message);

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle multiple handlers for the same type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const message = { type: ApiMessageType.SEND_MESSAGE, payload: { message: 'test' } };

      api.on(ApiMessageType.SEND_MESSAGE, handler1);
      api.on(ApiMessageType.SEND_MESSAGE, handler2);
      api.handleMessage(message);

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });

    it('should remove handlers correctly', () => {
      const handler = vi.fn();
      const message = { type: ApiMessageType.SEND_MESSAGE, payload: { message: 'test' } };

      api.on(ApiMessageType.SEND_MESSAGE, handler);
      api.off(ApiMessageType.SEND_MESSAGE, handler);
      api.handleMessage(message);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset to default configuration', async () => {
      // First set some custom configuration
      await api.setConfiguration({
        provider: LLMProviderId.OpenAI,
        apiKey: 'custom-key',
        modelId: 'custom-model',
        temperature: 0.9,
        maxTokens: 1000
      });

      // Then reset
      const response = await api.reset();
      expect(response.success).toBe(true);

      // Verify default configuration is restored
      const config = (await api.getConfiguration()).data;
      expect(config).toEqual({
        provider: LLMProviderId.OpenAI,
        apiKey: '',
        modelId: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000,
        organizationId: undefined
      });
    });
  });
}); 