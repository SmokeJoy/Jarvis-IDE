import type { ChatCompletionOptions } from "openai/resources/chat/completions.mjs"

declare module "openai/resources/chat/completions.mjs" {
  interface ChatCompletionOptions {
    model: string;
    messages: ChatCompletionMessageParam[];
    maxTokens?: number;
    temperature?: number;
    reasoning_effort?: string;
    stream?: boolean;
    stream_options?: {
      include_usage?: boolean;
    };
  }
}

export type { ChatCompletionOptions }; 