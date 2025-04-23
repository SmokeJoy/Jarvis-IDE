import { vi } from 'vitest';
import { z } from 'zod';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { JarvisAPI } from '../../shared/api/JarvisAPI'
import type { 
  ApiStreamTextChunk,
  ApiStreamUsageChunk,
  ApiStreamErrorChunk,
  ApiConfiguration,
  LLMProviderId
} from '../../shared/types/api.types'

describe('JarvisAPI E2E Tests', () => {
  let api: JarvisAPI
  
  const mockProvider = {
    sendMessage: vi.fn()
  }

  const defaultConfig: ApiConfiguration = {
    providerId: 'openai' as LLMProviderId,
    apiKey: 'test-key',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api = new JarvisAPI()
    api.configure(defaultConfig)
        api.provider = mockProvider
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('handles complete chat message roundtrip', async () => {
    const mockResponse: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = [
      { type: 'text', content: 'Test response' },
      { type: 'usage', tokens: { total: 10, completion: 5, prompt: 5 } }
    ]

    mockProvider.sendMessage.mockImplementation(async function* () {
      for (const chunk of mockResponse) {
        yield chunk
      }
    })

    const message = 'Test message'
    const chunks: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = []

    for await (const chunk of api.sendMessage(message)) {
      chunks.push(chunk)
    }

    expect(mockProvider.sendMessage).toHaveBeenCalledWith(message, expect.any(Object))
    expect(chunks).toEqual(mockResponse)
  })

  test('handles stream errors gracefully', async () => {
    const mockError: ApiStreamErrorChunk = {
      type: 'error',
      error: new Error('Test error')
    }

    mockProvider.sendMessage.mockImplementation(async function* () {
      yield { type: 'text', content: 'Partial response' }
      yield mockError
    })

    const chunks: (ApiStreamTextChunk | ApiStreamErrorChunk)[] = []
    let error: Error | undefined

    try {
      for await (const chunk of api.sendMessage('Test')) {
        chunks.push(chunk as any)
      }
    } catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('Test error')
    expect(chunks[0]).toEqual({ type: 'text', content: 'Partial response' })
  })

  test('processes multiple message sequences', async () => {
    const messages = ['Message 1', 'Message 2', 'Message 3']
    const mockResponses = messages.map(msg => ({ type: 'text', content: `Response to ${msg}` }))

    for (const [i, message] of messages.entries()) {
      mockProvider.sendMessage.mockImplementation(async function* () {
        yield mockResponses[i]
        yield { type: 'usage', tokens: { total: 10, completion: 5, prompt: 5 } }
      })

      const chunks: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = []
      for await (const chunk of api.sendMessage(message)) {
        chunks.push(chunk)
      }

      expect(chunks[0]).toEqual(mockResponses[i])
      expect(mockProvider.sendMessage).toHaveBeenNthCalledWith(i + 1, message, expect.any(Object))
    }

    expect(mockProvider.sendMessage).toHaveBeenCalledTimes(messages.length)
  })

  test('validates provider configuration', () => {
    const invalidConfigs: Partial<ApiConfiguration>[] = [
      { ...defaultConfig, apiKey: '' },
      { ...defaultConfig, model: '' },
      { ...defaultConfig, temperature: -1 },
      { ...defaultConfig, maxTokens: -100 }
    ]

    for (const config of invalidConfigs) {
      expect(() => api.configure(config as ApiConfiguration)).toThrow()
    }

    expect(() => api.configure(defaultConfig)).not.toThrow()
  })

  test('tracks usage metrics correctly', async () => {
    const mockUsage = {
      tokens: {
        total: 100,
        completion: 60,
        prompt: 40
      }
    }

    mockProvider.sendMessage.mockImplementation(async function* () {
      yield { type: 'text', content: 'Response' }
      yield { type: 'usage', tokens: mockUsage.tokens }
    })

    const chunks: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = []
    for await (const chunk of api.sendMessage('Test metrics')) {
      chunks.push(chunk)
    }

    const usageChunk = chunks.find(c => c.type === 'usage') as ApiStreamUsageChunk
    expect(usageChunk).toBeDefined()
    expect(usageChunk.tokens).toEqual(mockUsage.tokens)
  })

  test('handles provider-specific configurations', () => {
    const providerConfigs = {
      openai: { ...defaultConfig },
      anthropic: { ...defaultConfig, providerId: 'anthropic' as LLMProviderId, model: 'claude-3' },
      gemini: { ...defaultConfig, providerId: 'gemini' as LLMProviderId, model: 'gemini-pro' }
    }

    for (const [provider, config] of Object.entries(providerConfigs)) {
      expect(() => api.configure(config)).not.toThrow()
      expect(api.getConfiguration().providerId).toBe(config.providerId)
    }
  })

  test('respects rate limiting and concurrency', async () => {
    const messages = Array(5).fill('Test message')
    const delays = [100, 200, 150, 300, 250]

    mockProvider.sendMessage.mockImplementation(async function* (_, { delay = 0 } = {}) {
      await new Promise(resolve => setTimeout(resolve, delay))
      yield { type: 'text', content: 'Response' }
      yield { type: 'usage', tokens: { total: 10, completion: 5, prompt: 5 } }
    })

    const startTime = Date.now()
    await Promise.all(messages.map((msg, i) => {
      return new Promise<void>(async (resolve) => {
        for await (const _ of api.sendMessage(msg, { delay: delays[i] })) {
          // Process chunks
        }
        resolve()
      })
    }))
    const endTime = Date.now()

    expect(endTime - startTime).toBeGreaterThanOrEqual(Math.max(...delays))
    expect(mockProvider.sendMessage).toHaveBeenCalledTimes(messages.length)
  })
}) 