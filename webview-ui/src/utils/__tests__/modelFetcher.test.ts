import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webviewBridge } from '../WebviewBridge';
import { fetchModels, clearModelCache } from '../modelFetcher';
import type { FetchModelsResponse, OpenAiCompatibleModelInfo } from '@shared/types/llm.types';

// Mock del WebviewBridge
vi.mock('../WebviewBridge', () => ({
  webviewBridge: {
    sendMessage: vi.fn(),
  },
}));

describe('modelFetcher', () => {
  const mockModels: OpenAiCompatibleModelInfo[] = [
    { id: 'model1', name: 'Model 1', provider: 'openai' },
    { id: 'model2', name: 'Model 2', provider: 'anthropic' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    clearModelCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearModelCache();
  });

  describe('fetchModels', () => {
    it('should fetch models from bridge when cache is empty', async () => {
      const mockResponse: FetchModelsResponse = {
        models: mockModels,
      };

      // Setup mock response
      (webviewBridge.sendMessage as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchModels();

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'requestModels',
      });
      expect(result).toEqual(mockModels);
    });

    it('should return cached models if cache is valid', async () => {
      // First call to populate cache
      const mockResponse: FetchModelsResponse = {
        models: mockModels,
      };
      (webviewBridge.sendMessage as any).mockResolvedValueOnce(mockResponse);
      await fetchModels();

      // Reset mock
      vi.clearAllMocks();

      // Second call should use cache
      const result = await fetchModels();

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
      expect(result).toEqual(mockModels);
    });

    it('should handle error response', async () => {
      const mockError = 'Failed to fetch models';
      const mockResponse: FetchModelsResponse = {
        models: [],
        error: mockError,
      };

      (webviewBridge.sendMessage as any).mockResolvedValueOnce(mockResponse);

      await expect(fetchModels()).rejects.toThrow(mockError);
    });

    it('should handle bridge error', async () => {
      const mockError = new Error('Bridge error');
      (webviewBridge.sendMessage as any).mockRejectedValueOnce(mockError);

      await expect(fetchModels()).rejects.toThrow('Bridge error');
    });

    it('should fetch new models when force refresh is true', async () => {
      // First call to populate cache
      const initialResponse: FetchModelsResponse = {
        models: mockModels,
      };
      (webviewBridge.sendMessage as any).mockResolvedValueOnce(initialResponse);
      await fetchModels();

      // Reset mock
      vi.clearAllMocks();

      // Setup new response for force refresh
      const newModels = [...mockModels, { id: 'model3', name: 'Model 3', provider: 'openai' }];
      const newResponse: FetchModelsResponse = {
        models: newModels,
      };
      (webviewBridge.sendMessage as any).mockResolvedValueOnce(newResponse);

      // Force refresh should bypass cache
      const result = await fetchModels(true);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'requestModels',
      });
      expect(result).toEqual(newModels);
    });
  });

  describe('clearModelCache', () => {
    it('should clear the model cache', async () => {
      // Populate cache
      const mockResponse: FetchModelsResponse = {
        models: mockModels,
      };
      (webviewBridge.sendMessage as any).mockResolvedValueOnce(mockResponse);
      await fetchModels();

      // Clear cache
      clearModelCache();

      // Next fetch should call bridge again
      (webviewBridge.sendMessage as any).mockResolvedValueOnce(mockResponse);
      await fetchModels();

      expect(webviewBridge.sendMessage).toHaveBeenCalledTimes(2);
    });
  });
}); 