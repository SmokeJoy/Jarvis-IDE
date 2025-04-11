import { InMemoryAgentHistory } from '../../src/mas/memory/InMemoryAgentHistory';
import { AgentHistoryItem } from '../../src/mas/memory/agent-history-store';

describe('InMemoryAgentHistory', () => {
  let history: InMemoryAgentHistory;

  beforeEach(() => {
    history = new InMemoryAgentHistory();
  });

  test('save() e getLast() con multiple agentId', () => {
    const entry1: AgentHistoryItem = {
      prompt: 'test1',
      response: 'response1',
      timestamp: Date.now()
    };
    
    const entry2: AgentHistoryItem = {
      prompt: 'test2',
      response: 'response2',
      timestamp: Date.now()
    };

    history.save('agent1', entry1);
    history.save('agent2', entry2);

    expect(history.getLast('agent1')).toEqual(entry1);
    expect(history.getLast('agent2')).toEqual(entry2);
  });

  test('getRecent() con limite personalizzato', () => {
    const entries = Array(10).fill(null).map((_, i) => ({
      prompt: `test${i}`,
      response: `response${i}`,
      timestamp: Date.now()
    }));

    entries.forEach(entry => history.save('agent1', entry));
    
    expect(history.getRecent('agent1', 3)).toHaveLength(3);
    expect(history.getRecent('agent1')).toHaveLength(5);
  });

  test('clear() rimuove tutte le entry', () => {
    history.save('agent1', { prompt: 'test', response: 'response', timestamp: Date.now() });
    history.clear('agent1');
    
    expect(history.getLast('agent1')).toBeNull();
  });

  test('getLast() restituisce null per agentId inesistente', () => {
    expect(history.getLast('unknown')).toBeNull();
  });
});