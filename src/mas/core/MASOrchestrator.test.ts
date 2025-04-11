import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MASOrchestrator } from './MASOrchestrator';
import { WebviewMessageUnion } from '../../shared/types/webviewMessageUnion';
import { ZodSchemaMap } from '../../../utils/validation';

const mockProvider = {
  handle: vi.fn().mockResolvedValue('success'),
  id: 'openai',
  isEnabled: true
};

const mockHistoryStore = {
  recordInteraction: vi.fn().mockResolvedValue(null)
};

const mockFallbackHandler = {
  registerSuccess: vi.fn(),
  getNextProvider: vi.fn().mockReturnValue(mockProvider)
};

describe('MASOrchestrator', () => {
  let orchestrator: MASOrchestrator;
  const testSchema = {} as ZodSchemaMap;

  beforeEach(() => {
    vi.resetAllMocks();
    orchestrator = new MASOrchestrator();
    // @ts-expect-error Mock private property
    orchestrator.historyStore = mockHistoryStore;
    // @ts-expect-error Mock private property
    orchestrator.fallbackHandler = mockFallbackHandler;
  });

  it('dovrebbe inizializzare correttamente i provider predefiniti', () => {
    // @ts-expect-error Access private property
    expect(orchestrator.providers.length).toBeGreaterThan(0);
  });

  it('dovrebbe gestire correttamente un messaggio valido', async () => {
    const testMessage = {
      agentId: 'test-agent',
      payload: { prompt: 'test' },
      type: 'execute-strategy'
    } as WebviewMessageUnion;

    // @ts-expect-error Mock private method
    vi.spyOn(orchestrator, 'selectProvider').mockReturnValue(mockProvider);

    await orchestrator.executeAgentStrategy(testMessage, testSchema);
    
    expect(mockProvider.handle).toHaveBeenCalledWith(testMessage.payload);
    expect(mockHistoryStore.recordInteraction).toHaveBeenCalled();
    expect(mockFallbackHandler.registerSuccess).toHaveBeenCalledWith(mockProvider);
  });

  it('dovrebbe gestire errori durante l\'esecuzione', async () => {
    const errorMessage = 'Provider error';
    mockProvider.handle.mockRejectedValue(new Error(errorMessage));

    // @ts-expect-error Mock private method
    vi.spyOn(orchestrator, 'selectProvider').mockReturnValue(mockProvider);
    
    await expect(orchestrator.executeAgentStrategy(
      { type: 'execute-strategy', agentId: 'test', payload: {} },
      testSchema
    )).rejects.toThrow(errorMessage);
  });
});