import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouterStateManager } from '../state';
import { AppRoute } from '../routes';
import { logger } from '../../utils/logger';

// Mock del logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

describe('RouterStateManager', () => {
  let routerManager: RouterStateManager;

  beforeEach(() => {
    // Reset delle istanze e dei mock
    vi.clearAllMocks();
    RouterStateManager['instance'] = undefined;
    routerManager = RouterStateManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = RouterStateManager.getInstance();
      const instance2 = RouterStateManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getState', () => {
    it('should return initial state by default', () => {
      const state = routerManager.getState();
      expect(state).toEqual({
        currentRoute: AppRoute.HOME,
        previousRoute: null,
        params: {}
      });
    });

    it('should return a copy of the state', () => {
      const state1 = routerManager.getState();
      const state2 = routerManager.getState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('setRoute', () => {
    it('should update current route and set previous route', () => {
      routerManager.setRoute(AppRoute.SETTINGS);
      expect(routerManager.getState()).toEqual({
        currentRoute: AppRoute.SETTINGS,
        previousRoute: AppRoute.HOME,
        params: {}
      });
    });

    it('should update params when provided', () => {
      const params = { id: '123' };
      routerManager.setRoute(AppRoute.SETTINGS, params);
      expect(routerManager.getState().params).toEqual(params);
    });

    it('should log error and not update state for invalid route', () => {
      const initialState = routerManager.getState();
      routerManager.setRoute('INVALID_ROUTE');
      expect(logger.error).toHaveBeenCalledWith('Invalid route: INVALID_ROUTE');
      expect(routerManager.getState()).toEqual(initialState);
    });
  });

  describe('goBack', () => {
    it('should navigate to previous route if available', () => {
      routerManager.setRoute(AppRoute.SETTINGS);
      routerManager.goBack();
      expect(routerManager.getState().currentRoute).toBe(AppRoute.HOME);
    });

    it('should navigate to HOME if no previous route', () => {
      routerManager.goBack();
      expect(routerManager.getState().currentRoute).toBe(AppRoute.HOME);
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      routerManager.setRoute(AppRoute.SETTINGS, { id: '123' });
      routerManager.reset();
      expect(routerManager.getState()).toEqual({
        currentRoute: AppRoute.HOME,
        previousRoute: null,
        params: {}
      });
    });
  });

  describe('subscribe', () => {
    it('should notify listeners when state changes', () => {
      const listener = vi.fn();
      routerManager.subscribe(listener);
      routerManager.setRoute(AppRoute.SETTINGS);
      expect(listener).toHaveBeenCalledWith(routerManager.getState());
    });

    it('should handle multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      routerManager.subscribe(listener1);
      routerManager.subscribe(listener2);
      routerManager.setRoute(AppRoute.SETTINGS);
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing listeners', () => {
      const listener = vi.fn();
      const unsubscribe = routerManager.subscribe(listener);
      unsubscribe();
      routerManager.setRoute(AppRoute.SETTINGS);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      routerManager.subscribe(errorListener);
      routerManager.setRoute(AppRoute.SETTINGS);
      expect(logger.error).toHaveBeenCalledWith('Error in router state listener:', expect.any(Error));
    });
  });
}); 