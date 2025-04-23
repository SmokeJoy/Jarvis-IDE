import { z } from 'zod';
/**
 * @file modelValidator.test.ts
 * @description Test per l'utility di validazione dei modelli
 */

import {
  isModelInfoBase,
  isModelInfo,
  isOpenAiCompatibleModelInfo,
  isAnthropicModelInfo,
  isOpenRouterModelInfo,
  isAzureOpenAIModelInfo,
  isValidProviderId,
  validateModelInfoArray,
} from '../validators/modelValidator';
import { Logger } from '../logger';

// Mock del logger
jest.mock('../logger', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Model Validators', () => {
  describe('isModelInfoBase', () => {
    it('should return true for valid ModelInfoBase', () => {
      const valid = {
        id: 'model-id',
        name: 'Test Model',
        provider: 'anthropic',
        contextLength: 100000,
      };

      expect(isModelInfoBase(valid)).toBe(true);
    });

    it('should return false for invalid ModelInfoBase', () => {
      // Undefined
      expect(isModelInfoBase(undefined)).toBe(false);

      // Null
      expect(isModelInfoBase(null)).toBe(false);

      // Not an object
      expect(isModelInfoBase('string')).toBe(false);

      // Missing properties
      expect(isModelInfoBase({})).toBe(false);
      expect(isModelInfoBase({ id: 'id' })).toBe(false);
      expect(isModelInfoBase({ id: 'id', name: 'name' })).toBe(false);

      // Invalid properties
      expect(
        isModelInfoBase({
          id: '', // Empty string
          name: 'Test Model',
          provider: 'anthropic',
          contextLength: 100000,
        })
      ).toBe(false);

      expect(
        isModelInfoBase({
          id: 'model-id',
          name: 'Test Model',
          provider: 'anthropic',
          contextLength: -100, // Negative context length
        })
      ).toBe(false);
    });
  });

  describe('isModelInfo', () => {
    it('should return true for valid ModelInfo', () => {
      const valid = {
        id: 'model-id',
        name: 'Test Model',
        provider: 'anthropic',
        contextLength: 100000,
        maxTokens: 4096,
        supportsImages: true,
        inputPrice: 0.001,
        outputPrice: 0.002,
      };

      expect(isModelInfo(valid)).toBe(true);
    });

    it('should validate optional properties correctly', () => {
      // Missing optional properties
      const validMinimal = {
        id: 'model-id',
        name: 'Test Model',
        provider: 'anthropic',
        contextLength: 100000,
      };

      expect(isModelInfo(validMinimal)).toBe(true);

      // Invalid optional properties
      const invalidMaxTokens = {
        id: 'model-id',
        name: 'Test Model',
        provider: 'anthropic',
        contextLength: 100000,
        maxTokens: -100, // Invalid
      };

      expect(isModelInfo(invalidMaxTokens)).toBe(false);

      const invalidCapabilities = {
        id: 'model-id',
        name: 'Test Model',
        provider: 'anthropic',
        contextLength: 100000,
        capabilities: 'not-an-array', // Invalid type
      };

      expect(isModelInfo(invalidCapabilities)).toBe(false);

      const invalidBooleans = {
        id: 'model-id',
        name: 'Test Model',
        provider: 'anthropic',
        contextLength: 100000,
        supportsImages: 'yes', // Should be boolean
      };

      expect(isModelInfo(invalidBooleans)).toBe(false);
    });
  });

  describe('Provider-specific validators', () => {
    it('should validate OpenAiCompatibleModelInfo correctly', () => {
      const valid = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        contextLength: 128000,
        maxCompletionTokens: 4000,
      };

      expect(isOpenAiCompatibleModelInfo(valid)).toBe(true);

      const invalid = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        contextLength: 128000,
        maxCompletionTokens: -1, // Invalid
      };

      expect(isOpenAiCompatibleModelInfo(invalid)).toBe(false);
    });

    it('should validate AnthropicModelInfo correctly', () => {
      const valid = {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic', // Must be anthropic
        contextLength: 200000,
        version: '3.0',
        supportsJsonMode: true,
      };

      expect(isAnthropicModelInfo(valid)).toBe(true);

      const wrongProvider = {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'openai', // Wrong provider
        contextLength: 200000,
        version: '3.0',
      };

      expect(isAnthropicModelInfo(wrongProvider)).toBe(false);

      const invalidVersion = {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        contextLength: 200000,
        version: true, // Invalid type
      };

      expect(isAnthropicModelInfo(invalidVersion)).toBe(false);
    });

    it('should validate OpenRouterModelInfo correctly', () => {
      const valid = {
        id: 'anthropic/claude-3-opus',
        name: 'Claude via OpenRouter',
        provider: 'openrouter', // Must be openrouter
        contextLength: 200000,
        created: 1706151801,
        performanceScore: 9.8,
        originalProvider: 'anthropic',
      };

      expect(isOpenRouterModelInfo(valid)).toBe(true);

      const wrongProvider = {
        id: 'anthropic/claude-3-opus',
        name: 'Claude via OpenRouter',
        provider: 'anthropic', // Wrong provider
        contextLength: 200000,
        created: 1706151801,
      };

      expect(isOpenRouterModelInfo(wrongProvider)).toBe(false);

      const invalidScore = {
        id: 'anthropic/claude-3-opus',
        name: 'Claude via OpenRouter',
        provider: 'openrouter',
        contextLength: 200000,
        performanceScore: 11, // Invalid (>10)
      };

      expect(isOpenRouterModelInfo(invalidScore)).toBe(false);
    });

    it('should validate AzureOpenAIModelInfo correctly', () => {
      const valid = {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo (Azure)',
        provider: 'azureopenai', // Must be azureopenai
        contextLength: 128000,
        deploymentId: 'gpt4-deployment', // Required
        apiVersion: '2023-05-15',
      };

      expect(isAzureOpenAIModelInfo(valid)).toBe(true);

      const missingDeploymentId = {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo (Azure)',
        provider: 'azureopenai',
        contextLength: 128000,
        // Missing deploymentId
        apiVersion: '2023-05-15',
      };

      expect(isAzureOpenAIModelInfo(missingDeploymentId)).toBe(false);

      const wrongProvider = {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo (Azure)',
        provider: 'openai', // Wrong provider
        contextLength: 128000,
        deploymentId: 'gpt4-deployment',
      };

      expect(isAzureOpenAIModelInfo(wrongProvider)).toBe(false);
    });
  });

  describe('isValidProviderId', () => {
    it('should return true for valid provider IDs', () => {
      expect(isValidProviderId('anthropic')).toBe(true);
      expect(isValidProviderId('openai')).toBe(true);
      expect(isValidProviderId('azureopenai')).toBe(true);
      expect(isValidProviderId('openrouter')).toBe(true);
      expect(isValidProviderId('default')).toBe(true);
    });

    it('should return false for invalid provider IDs', () => {
      expect(isValidProviderId('unknown')).toBe(false);
      expect(isValidProviderId('')).toBe(false);
      expect(isValidProviderId('ANTHROPIC')).toBe(false); // Case sensitive
    });
  });

  describe('validateModelInfoArray', () => {
    it('should filter invalid models and return valid ones', () => {
      const models = [
        {
          id: 'valid-1',
          name: 'Valid Model 1',
          provider: 'anthropic',
          contextLength: 100000,
        },
        {
          id: 'valid-2',
          name: 'Valid Model 2',
          provider: 'openai',
          contextLength: 128000,
          supportsImages: true,
        },
        {
          name: 'Invalid Model', // Missing id
          provider: 'mistral',
          contextLength: 32000,
        },
        {
          id: 'invalid-2',
          name: 'Invalid Model 2',
          provider: 'anthropic',
          contextLength: -100, // Invalid negative
        },
      ];

      const result = validateModelInfoArray(models, 'TestProvider');

      // Should have only the two valid models
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('valid-1');
      expect(result[1].id).toBe('valid-2');

      // Should log warning
      expect(Logger.warn).toHaveBeenCalledWith(
        'TestProvider: 2 modelli non validi sono stati filtrati'
      );
    });

    it('should handle non-array input', () => {
      const notAnArray = 'not an array';

      const result = validateModelInfoArray(notAnArray as any, 'TestProvider');

      expect(result).toEqual([]);
      expect(Logger.warn).toHaveBeenCalledWith(
        'TestProvider: Modelli ricevuti non sono un array valido'
      );
    });
  });
});
