import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, withRetryWrapper, type RetryOptions } from '../retry';

// Mock del setTimeout per evitare attese reali nei test
vi.useFakeTimers();

describe('retry utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('withRetry', () => {
    it('should return immediately on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, { maxAttempts: 3 });
      
      // Avanza i timer per ogni retry
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const error = new Error('persistent failure');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = withRetry(fn, { maxAttempts: 2 });
      
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect delay options', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValue('success');

      const options: RetryOptions = {
        maxAttempts: 2,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 2
      };

      const promise = withRetry(fn, options);
      
      // Il primo tentativo fallisce immediatamente
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Avanza il timer del delay
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withRetryWrapper', () => {
    it('should wrap function and maintain its signature', async () => {
      const original = async (x: number, y: string) => `${x}-${y}`;
      const wrapped = withRetryWrapper(original);

      const result = await wrapped(42, 'test');
      expect(result).toBe('42-test');
    });

    it('should apply retry logic to wrapped function', async () => {
      const error = new Error('temporary failure');
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
        
      const wrapped = withRetryWrapper(fn, { maxAttempts: 2 });
      
      const promise = wrapped();
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
}); 