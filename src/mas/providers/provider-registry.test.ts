test('Tutti i provider noti sono registrabili', () => {
  const knownProviders: LLMProviderId[] = [
    'openai', 'openrouter', 'ollama', 'anthropic', 'mistral', 'google', 'cohere'
  ];

  class MockValidProvider {
    call(params: any) {
      return Promise.resolve({ output: 'mock output' });
    }

    getAvailableModels() {
      return Promise.resolve([{ id: 'mock-model', name: 'Mock Model' }]);
    }

    constructor(options: any) {}
  }

  for (const pid of knownProviders) {
    expect(() => registerProvider(pid, MockValidProvider)).not.toThrow();
    expect(hasProvider(pid)).toBe(true);
  }
});