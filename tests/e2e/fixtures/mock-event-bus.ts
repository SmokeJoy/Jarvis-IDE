import type { LLMEventBus } from '../../../src/mas/core/fallback/LLMEventBus';

export const createMockEventBus = (): LLMEventBus => {
  const listeners = new Map<string, Function[]>();

  return {
    on: (event: string, callback: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(callback);
    },

    off: (event: string, callback: Function) => {
      if (!listeners.has(event)) return;
      const eventListeners = listeners.get(event)!;
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    },

    emit: async (event: string, data: any) => {
      if (!listeners.has(event)) return;
      const eventListeners = listeners.get(event)!;
      for (const listener of eventListeners) {
        await listener(data);
      }
    },

    clear: () => {
      listeners.clear();
    }
  };
}; 