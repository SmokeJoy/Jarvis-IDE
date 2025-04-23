import type { PromptRunMode } from './prompt';

export interface PromptStrategy {
  name: string;
  run: (input: string, mode: PromptRunMode) => Promise<PromptResult>;
}

export type PromptResult = {
  output: string;
  tokenUsage: number;
}; 