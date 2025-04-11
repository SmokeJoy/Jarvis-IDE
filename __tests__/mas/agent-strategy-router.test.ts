import { selectAgentStrategy } from '../../src/mas/strategy/agent-strategy-router.js';
import type { MASInputMessage } from '../../src/mas/types/mas.types.js';

describe('AgentStrategyRouter', () => {
  const testInput: MASInputMessage = {
    agentId: 'test',
    payload: { task: 'sample' },
    timestamp: Date.now()
  };

  test('Seleziona strategia corretta per agentId', () => {
    expect(selectAgentStrategy('agent1').id).toBe('sequential');
    expect(selectAgentStrategy('agent2').id).toBe('parallel');
    expect(selectAgentStrategy('fallback').id).toBe('fallback-only');
    expect(selectAgentStrategy('stream').id).toBe('stream-first');
  });

  test('Fallback per agentId sconosciuto', () => {
    const strategy = selectAgentStrategy('unknown');
    expect(strategy.id).toBe('fallback-only');
  });

  test('Esegue metodo run delle strategie', async () => {
    const strategies = [
      selectAgentStrategy('agent1'),
      selectAgentStrategy('agent2'),
      selectAgentStrategy('stream')
    ];

    for (const strategy of strategies) {
      const output = await strategy.run(testInput);
      expect(output.strategy).toBe(strategy.id);
      expect(output.payload).toEqual(testInput.payload);
    }
  });
});