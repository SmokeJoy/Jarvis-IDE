import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryProviderScoreManager } from '../../mas/metrics/provider-score-manager';
import { LLMProviderId } from '../../types/llm-provider';

describe('InMemoryProviderScoreManager', () => {
  const providers: LLMProviderId[] = ['openai', 'anthropic', 'groq'];
  let scoreManager: InMemoryProviderScoreManager;

  beforeEach(() => {
    scoreManager = new InMemoryProviderScoreManager();
  });

  it('aggiorna correttamente le statistiche per chiamate riuscite e fallite', () => {
    scoreManager.updateScore('openai', true, 1000);
    scoreManager.updateScore('openai', false, 2000);
    
    const stats = scoreManager.getStats('openai');
    expect(stats.successRate).toBe(0.5);
    expect(stats.averageTime).toBe(1500);
    expect(stats.retryCount).toBe(1);
  });

  it('seleziona il provider con il success rate più alto', () => {
    // OpenAI: 2/3 successi (66%)
    scoreManager.updateScore('openai', true, 1000);
    scoreManager.updateScore('openai', true, 2000);
    scoreManager.updateScore('openai', false, 3000);

    // Anthropic: 3/3 successi (100%)
    scoreManager.updateScore('anthropic', true, 1500);
    scoreManager.updateScore('anthropic', true, 1500);
    scoreManager.updateScore('anthropic', true, 1500);

    const best = scoreManager.getBestProvider(providers);
    expect(best).toBe('anthropic');
  });

  it('preferisce tempi medi più bassi a parità di success rate', () => {
    scoreManager.updateScore('openai', true, 1000);
    scoreManager.updateScore('anthropic', true, 2000);
    
    const best = scoreManager.getBestProvider(['openai', 'anthropic']);
    expect(best).toBe('openai');
  });

  it('gestisce correttamente i retry count', () => {
    scoreManager.updateScore('groq', false, 1000);
    scoreManager.updateScore('groq', false, 1000);
    
    const stats = scoreManager.getStats('groq');
    expect(stats.retryCount).toBe(2);
  });
});