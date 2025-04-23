import { APIConfiguration } from '@shared/types/api.types';

export const openaiConfig: APIConfiguration = {
  name: 'OpenAI',
  description: 'OpenAI API provider for GPT models',
  configFields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: 'sk-...',
      description: 'Your OpenAI API key'
    },
    {
      key: 'organization',
      label: 'Organization ID',
      type: 'text',
      required: false,
      placeholder: 'org-...',
      description: 'Optional: Your OpenAI organization ID'
    },
    {
      key: 'temperature',
      label: 'Temperature',
      type: 'number',
      required: false,
      default: '0.7',
      min: '0',
      max: '2',
      step: '0.1',
      description: 'Controls randomness in the model\'s output (0-2)'
    },
    {
      key: 'maxTokens',
      label: 'Max Tokens',
      type: 'number',
      required: false,
      default: '2048',
      min: '1',
      max: '32768',
      step: '1',
      description: 'Maximum number of tokens to generate'
    }
  ],
  defaultModel: 'gpt-3.5-turbo',
  capabilities: {
    streaming: true,
    modelList: true,
    functionCalling: true,
    systemPrompts: true,
    contextWindow: true
  }
}; 