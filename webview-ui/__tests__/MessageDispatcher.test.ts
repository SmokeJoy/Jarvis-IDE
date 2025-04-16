import { handleWebviewMessage } from '../src/core/MessageDispatcher';
import { SuggestionsMessageType } from '../src/types/suggestions-message';
import { AgentMemoryMessageType } from '../src/types/agent-memory-message';

describe('MessageDispatcher', () => {
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('chiama il giusto handler per suggestionsUpdated', () => {
    const message = { type: SuggestionsMessageType.SUGGESTIONS_UPDATED, payload: { suggestions: [] } };
    handleWebviewMessage(message);
    expect(infoSpy).toHaveBeenCalledWith('Handled suggestionsUpdated', message);
  });

  it('chiama il giusto handler per memoryItemSaved', () => {
    const message = { type: AgentMemoryMessageType.MEMORY_ITEM_SAVED, payload: { agentId: 'a', item: {} } };
    handleWebviewMessage(message);
    expect(infoSpy).toHaveBeenCalledWith('Handled memoryItemSaved', message);
  });

  it('logga un warning per type sconosciuto', () => {
    const message = { type: 'unknownType', payload: {} };
    handleWebviewMessage(message);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Nessun handler'), expect.anything());
  });

  it('logga un warning per messaggio non valido', () => {
    handleWebviewMessage(null);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Messaggio non valido'), null);
  });
}); 