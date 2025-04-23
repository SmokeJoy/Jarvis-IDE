import type { PromptRunMode, PromptStrategy, PromptResult } from '@shared/messages';

export class PromptEngine {
  constructor(private strategy: PromptStrategy) {}

  async run(input: string, mode: PromptRunMode): Promise<PromptResult> {
    return this.strategy.run(input, mode);
  }
}

const defaultStrategy: PromptStrategy = {
  name: 'default',
  async run(input, mode) {
    return {
      output: `[${mode}] → ${input}`,
      tokenUsage: input.length,
    };
  },
};

export const engine = new PromptEngine(defaultStrategy); 