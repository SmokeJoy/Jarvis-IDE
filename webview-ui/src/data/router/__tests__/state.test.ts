import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterState, RouterStateManager } from '../state';

describe('RouterStateManager', () => {
  let stateManager: RouterStateManager;
  let mockSubscriber: (state: RouterState) => void;

  beforeEach(() => {
    // Reset singleton instance before each test
    RouterStateManager['instance'] = null;
    stateManager = RouterStateManager.getInstance();
    mockSubscriber = vi.fn();
  });

  describe('getInstance', () => {
    it('should create a singleton instance', () => {
      const instance1 = RouterStateManager.getInstance();
      const instance2 = RouterStateManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default state', () => {
      const state = stateManager.getState();
      expect(state).toEqual({
        currentRoute: '/',
        params: {},
        history: [],
        sidebarVisible: true,
        terminalVisible: false,
        theme: 'light',
        fontSize: 14
      });
    });
  });

  describe('state management', () => {
    it('should update current route', () => {
      stateManager.setRoute('/test', { id: '123' });
      const state = stateManager.getState();
      expect(state.currentRoute).toBe('/test');
      expect(state.params).toEqual({ id: '123' });
    });

    it('should maintain route history', () => {
      stateManager.setRoute('/first');
      stateManager.setRoute('/second');
      stateManager.setRoute('/third');

      const state = stateManager.getState();
      expect(state.history).toEqual(['/first', '/second', '/third']);
    });

    it('should toggle sidebar visibility', () => {
      const initialState = stateManager.getState();
      stateManager.toggleSidebar();
      
      const newState = stateManager.getState();
      expect(newState.sidebarVisible).toBe(!initialState.sidebarVisible);
    });

    it('should toggle terminal visibility', () => {
      const initialState = stateManager.getState();
      stateManager.toggleTerminal();
      
      const newState = stateManager.getState();
      expect(newState.terminalVisible).toBe(!initialState.terminalVisible);
    });

    it('should set theme', () => {
      stateManager.setTheme('dark');
      expect(stateManager.getState().theme).toBe('dark');
    });

    it('should set font size', () => {
      stateManager.setFontSize(16);
      expect(stateManager.getState().fontSize).toBe(16);
    });
  });

  describe('subscription management', () => {
    it('should notify subscribers when state changes', () => {
      stateManager.subscribe(mockSubscriber);
      stateManager.setRoute('/test');
      
      expect(mockSubscriber).toHaveBeenCalledWith(stateManager.getState());
    });

    it('should allow multiple subscribers', () => {
      const mockSubscriber2 = vi.fn();
      
      stateManager.subscribe(mockSubscriber);
      stateManager.subscribe(mockSubscriber2);
      stateManager.setRoute('/test');
      
      expect(mockSubscriber).toHaveBeenCalled();
      expect(mockSubscriber2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const unsubscribe = stateManager.subscribe(mockSubscriber);
      unsubscribe();
      stateManager.setRoute('/test');
      
      expect(mockSubscriber).not.toHaveBeenCalled();
    });

    it('should not notify unsubscribed listeners', () => {
      const mockSubscriber2 = vi.fn();
      
      stateManager.subscribe(mockSubscriber);
      const unsubscribe2 = stateManager.subscribe(mockSubscriber2);
      
      unsubscribe2();
      stateManager.setRoute('/test');
      
      expect(mockSubscriber).toHaveBeenCalled();
      expect(mockSubscriber2).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle invalid route parameters', () => {
      expect(() => stateManager.setRoute('')).not.toThrow();
      expect(stateManager.getState().currentRoute).toBe('/');
    });

    it('should handle invalid theme values', () => {
      expect(() => stateManager.setTheme('invalid')).not.toThrow();
      expect(stateManager.getState().theme).toBe('light');
    });

    it('should handle invalid font sizes', () => {
      expect(() => stateManager.setFontSize(-1)).not.toThrow();
      expect(stateManager.getState().fontSize).toBe(14);
    });
  });

  describe('state immutability', () => {
    it('should return immutable state', () => {
      const state = stateManager.getState();
      const initialRoute = state.currentRoute;
      
      // Attempt to modify state directly
      state.currentRoute = '/modified';
      
      expect(stateManager.getState().currentRoute).toBe(initialRoute);
    });

    it('should maintain history immutability', () => {
      stateManager.setRoute('/first');
      const state = stateManager.getState();
      
      // Attempt to modify history directly
      state.history.push('/modified');
      
      expect(stateManager.getState().history).toEqual(['/first']);
    });
  });
}); 