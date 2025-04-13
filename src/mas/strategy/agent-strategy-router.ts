import { MASInputMessage, MASOutputMessage } from '../types/mas.types';

export interface StrategyHandler {
  id: 'sequential' | 'parallel' | 'fallback-only' | 'stream-first';
  run(input: MASInputMessage): Promise<MASOutputMessage>;
}

export class SequentialStrategy implements StrategyHandler {
  id = 'sequential' as const;

  async run(input: MASInputMessage): Promise<MASOutputMessage> {
    // Implementazione sequenziale
    return { ...input, strategy: this.id };
  }
}

export class ParallelStrategy implements StrategyHandler {
  id = 'parallel' as const;

  async run(input: MASInputMessage): Promise<MASOutputMessage> {
    // Implementazione parallela
    return { ...input, strategy: this.id };
  }
}

export class FallbackOnlyStrategy implements StrategyHandler {
  id = 'fallback-only' as const;

  async run(input: MASInputMessage): Promise<MASOutputMessage> {
    // Implementazione fallback-only
    return { ...input, strategy: this.id };
  }
}

export class StreamFirstStrategy implements StrategyHandler {
  id = 'stream-first' as const;

  async run(input: MASInputMessage): Promise<MASOutputMessage> {
    // Implementazione stream-first
    return { ...input, strategy: this.id };
  }
}

export function selectAgentStrategy(agentId: string): StrategyHandler {
  const strategyMap: Record<string, StrategyHandler> = {
    agent1: new SequentialStrategy(),
    agent2: new ParallelStrategy(),
    fallback: new FallbackOnlyStrategy(),
    stream: new StreamFirstStrategy(),
  };

  return strategyMap[agentId] || new FallbackOnlyStrategy();
}
