import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TelemetryTracker } from '../../../src/mas/core/fallback/TelemetryTracker';

describe('TelemetryTracker', () => {
  let tracker: TelemetryTracker;
  const providerId = 'test-provider';

  beforeEach(() => {
    tracker = new TelemetryTracker();
  });

  describe('initialization', () => {
    it('should initialize with empty stats', () => {
      const stats = tracker.getStats(providerId);
      expect(stats).toEqual({
        providerId,
        successCount: 0,
        failureCount: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        isInCooldown: false,
        lastError: null,
        cooldownEndTime: null
      });
    });

    it('should use custom cooldown duration', () => {
      const customCooldownMs = 30_000;
      tracker = new TelemetryTracker(customCooldownMs);
      tracker.recordFailure(providerId, new Error('test error'));
      const stats = tracker.getStats(providerId);
      expect(stats.cooldownEndTime).toBeGreaterThan(Date.now());
      expect(stats.cooldownEndTime).toBeLessThanOrEqual(Date.now() + customCooldownMs);
    });
  });

  describe('success tracking', () => {
    it('should record successful request with latency', () => {
      const latency = 100;
      tracker.recordSuccess(providerId, latency);
      const stats = tracker.getStats(providerId);
      expect(stats.successCount).toBe(1);
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(latency);
    });

    it('should calculate correct average response time', () => {
      tracker.recordSuccess(providerId, 100);
      tracker.recordSuccess(providerId, 200);
      const stats = tracker.getStats(providerId);
      expect(stats.averageResponseTime).toBe(150);
    });

    it('should clear cooldown on success', () => {
      tracker.recordFailure(providerId, new Error('test error'));
      tracker.recordSuccess(providerId, 100);
      const stats = tracker.getStats(providerId);
      expect(stats.isInCooldown).toBe(false);
      expect(stats.cooldownEndTime).toBeNull();
    });
  });

  describe('failure tracking', () => {
    it('should record failed request with error', () => {
      const error = new Error('test error');
      tracker.recordFailure(providerId, error);
      const stats = tracker.getStats(providerId);
      expect(stats.failureCount).toBe(1);
      expect(stats.totalRequests).toBe(1);
      expect(stats.lastError).toBe(error.message);
      expect(stats.isInCooldown).toBe(true);
      expect(stats.cooldownEndTime).toBeGreaterThan(Date.now());
    });

    it('should use custom cooldown duration for failure', () => {
      const customCooldownMs = 15_000;
      tracker.recordFailure(providerId, new Error('test error'), customCooldownMs);
      const stats = tracker.getStats(providerId);
      expect(stats.cooldownEndTime).toBeGreaterThan(Date.now());
      expect(stats.cooldownEndTime).toBeLessThanOrEqual(Date.now() + customCooldownMs);
    });
  });

  describe('cooldown management', () => {
    it('should detect active cooldown', () => {
      tracker.recordFailure(providerId, new Error('test error'));
      expect(tracker.isCoolingDown(providerId)).toBe(true);
    });

    it('should clear expired cooldown', () => {
      const pastTime = Date.now() - 1000;
      const stats = tracker.getStats(providerId);
      stats.isInCooldown = true;
      stats.cooldownEndTime = pastTime;
      expect(tracker.isCoolingDown(providerId)).toBe(false);
    });
  });

  describe('rate calculations', () => {
    it('should calculate success rate', () => {
      tracker.recordSuccess(providerId, 100);
      tracker.recordSuccess(providerId, 100);
      tracker.recordFailure(providerId, new Error('test error'));
      expect(tracker.getSuccessRate(providerId)).toBe(2/3);
    });

    it('should calculate failure rate', () => {
      tracker.recordSuccess(providerId, 100);
      tracker.recordFailure(providerId, new Error('test error'));
      tracker.recordFailure(providerId, new Error('test error'));
      expect(tracker.getFailureRate(providerId)).toBe(2/3);
    });

    it('should handle zero requests', () => {
      expect(tracker.getSuccessRate(providerId)).toBe(0);
      expect(tracker.getFailureRate(providerId)).toBe(0);
    });
  });

  describe('stats management', () => {
    it('should reset stats for provider', () => {
      tracker.recordSuccess(providerId, 100);
      tracker.resetStats(providerId);
      const stats = tracker.getStats(providerId);
      expect(stats.successCount).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });

    it('should get all stats', () => {
      const provider2 = 'provider-2';
      tracker.recordSuccess(providerId, 100);
      tracker.recordSuccess(provider2, 200);
      const allStats = tracker.getAllStats();
      expect(allStats.size).toBe(2);
      expect(allStats.get(providerId)?.successCount).toBe(1);
      expect(allStats.get(provider2)?.successCount).toBe(1);
    });
  });
}); 