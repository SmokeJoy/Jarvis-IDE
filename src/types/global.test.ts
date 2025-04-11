import { expect, test } from 'vitest'
import type {
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage,
  ApiConfiguration,
  OpenAiCompatibleModelInfo,
  TelemetrySetting
} from './global.js'

test('ChatCompletionContentPartText deve avere le proprietà corrette', () => {
  const textPart: ChatCompletionContentPartText = {
    type: 'text',
    text: 'test'
  }

  expect(textPart.type).toBe('text')
  expect(textPart.text).toBe('test')
})

test('ChatCompletionContentPartImage deve avere le proprietà corrette', () => {
  const imagePart: ChatCompletionContentPartImage = {
    type: 'image_url',
    image_url: {
      url: 'https://example.com/image.png',
      detail: 'high'
    }
  }

  expect(imagePart.type).toBe('image_url')
  expect(imagePart.image_url.url).toBe('https://example.com/image.png')
  expect(imagePart.image_url.detail).toBe('high')
})

test('Possiamo creare un array di parti di contenuto misto', () => {
  const parts = [
    {
      type: 'text',
      text: 'test'
    } as ChatCompletionContentPartText,
    {
      type: 'image_url',
      image_url: {
        url: 'https://example.com/image.png'
      }
    } as ChatCompletionContentPartImage
  ]

  expect(parts.length).toBe(2)
  expect(parts[0].type).toBe('text')
  expect(parts[1].type).toBe('image_url')
})

test('ApiConfiguration deve avere le proprietà corrette', () => {
  const config: ApiConfiguration = {
    provider: 'openai',
    apiKey: 'test-key',
    modelId: 'gpt-4',
    temperature: 0.5,
    maxTokens: 1000
  }

  expect(config.provider).toBe('openai')
  expect(config.apiKey).toBe('test-key')
  expect(config.modelId).toBe('gpt-4')
  expect(config.temperature).toBe(0.5)
  expect(config.maxTokens).toBe(1000)
})

test('OpenAiCompatibleModelInfo deve avere le proprietà corrette', () => {
  const modelInfo: OpenAiCompatibleModelInfo = {
    id: 'gpt-4',
    name: 'GPT-4',
    maxTokens: 8192,
    contextLength: 8192,
    provider: 'openai',
    pricing: {
      input: 0.01,
      output: 0.03
    },
    supportsImages: true,
    supportsTools: true,
    supportsVision: true
  }

  expect(modelInfo.id).toBe('gpt-4')
  expect(modelInfo.name).toBe('GPT-4')
  expect(modelInfo.provider).toBe('openai')
  expect(modelInfo.supportsImages).toBe(true)
  expect(modelInfo.supportsTools).toBe(true)
  expect(modelInfo.supportsVision).toBe(true)
})

test('TelemetrySetting supporta diversi formati', () => {
  // Formato oggetto
  const objFormat: TelemetrySetting = { enabled: true }
  
  // Formato stringa
  const enabledStr: TelemetrySetting = "enabled"
  const disabledStr: TelemetrySetting = "disabled"
  const askStr: TelemetrySetting = "ask"
  
  expect(objFormat).toEqual({ enabled: true })
  expect(enabledStr).toBe("enabled")
  expect(disabledStr).toBe("disabled")
  expect(askStr).toBe("ask")
}) 