declare module 'provider-types' {
  export interface BaseProvider {
    id: string;
    name: string;
    type: string;
  }

  export interface ApiProvider extends BaseProvider {
    apiKey?: string;
    baseUrl?: string;
    modelInfo?: {
      id: string;
      name: string;
      contextWindow?: number;
      maxTokens?: number;
    };
  }

  export interface ExtendedApiConfiguration {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
    modelInfo?: {
      id: string;
      name: string;
      contextWindow?: number;
      maxTokens?: number;
    };
  }

  export interface OpenAiCompatibleModelInfo {
    id: string;
    name: string;
    contextWindow?: number;
    maxTokens?: number;
  }

  export interface TaskQueueState {
    tasks: Array<{
      id: string;
      status: string;
      message?: string;
      error?: string;
    }>;
    running: boolean;
    aborted: boolean;
    lastUpdated: number;
  }

  export interface Task {
    id: string;
    type: string;
    status: string;
    message?: string;
    error?: string;
  }

  export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'aborted';
}
