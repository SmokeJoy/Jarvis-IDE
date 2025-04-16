import { ApiConfiguration } from '../shared/types/api.types';
import { MultiAgentConfiguration } from '../shared/types/multi-agent.types';

interface Agent {
  name: string;
  role: string;
  provider: string;
}

interface MultiAgentConfiguration {
  multiAgent: boolean;
  agents: Agent[];
}

type ExtendedApiConfiguration = ApiConfiguration & Partial<MultiAgentConfiguration>;

export function validateApiConfiguration(config: ExtendedApiConfiguration): string[] {
  const errors: string[] = [];

  if (!config) {
    errors.push('Configuration is required');
    return errors;
  }

  // Validate OpenRouter configuration
  if (config.provider === 'openrouter') {
    if (!config.openRouterApiKey) {
      errors.push('OpenRouter API key is required');
    }
    if (!config.openRouterModelInfo) {
      errors.push('OpenRouter model selection is required');
    }
  }

  // Validate OpenAI configuration
  if (config.provider === 'openai') {
    if (!config.openAiApiKey) {
      errors.push('OpenAI API key is required');
    }
    if (!config.openAiModelInfo) {
      errors.push('OpenAI model selection is required');
    }
  }

  // Validate Anthropic configuration
  if (config.provider === 'anthropic') {
    if (!config.anthropicApiKey) {
      errors.push('Anthropic API key is required');
    }
    if (!config.anthropicModelInfo) {
      errors.push('Anthropic model selection is required');
    }
  }

  // Validate Ollama configuration
  if (config.provider === 'ollama') {
    if (!config.ollamaBaseUrl) {
      errors.push('Ollama base URL is required');
    }
  }

  // Validate LM Studio configuration
  if (config.provider === 'lmstudio') {
    if (!config.lmStudioBaseUrl) {
      errors.push('LM Studio base URL is required');
    }
  }

  // Validate multi-agent configuration
  if (config.multiAgent) {
    if (!config.agents || config.agents.length === 0) {
      errors.push('At least one agent is required for multi-agent configuration');
    } else {
      config.agents.forEach((agent: Agent, index: number) => {
        if (!agent.name) {
          errors.push(`Agent ${index + 1} must have a name`);
        }
        if (!agent.role) {
          errors.push(`Agent ${index + 1} must have a role`);
        }
        if (!agent.provider) {
          errors.push(`Agent ${index + 1} must have a provider`);
        }
      });
    }
  }

  return errors;
}
