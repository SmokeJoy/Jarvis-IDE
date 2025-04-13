export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: string;
}

export interface OpenAIDelta {
  role?: string;
  content?: string;
}

export interface OpenAIStreamChoice {
  index: number;
  delta: OpenAIDelta;
  finish_reason: string | null;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
}

export interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIStreamChoice[];
}
