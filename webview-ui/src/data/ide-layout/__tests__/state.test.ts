import { vi } from 'vitest';
/**
 * @file state.test.ts
 * @description Test per lo state manager del modulo ide-layout
 * @author dev ai 1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ideLayoutManager, INITIAL_STATE } from '../state';

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('IdeLayoutManager', () => {
  beforeEach(() => {
    // Reset dello stato prima di ogni test
    ideLayoutManager.reset();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(ideLayoutManager.getState()).toEqual(INITIAL_STATE);
    });

    it('should return immutable state copy', () => {
      const state1 = ideLayoutManager.getState();
      const state2 = ideLayoutManager.getState();
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe('panel visibility', () => {
    it('should toggle sidebar visibility', () => {
      const initialVisible = ideLayoutManager.getState().panels.sidebar.visible;
      ideLayoutManager.toggleSidebar();
      expect(ideLayoutManager.getState().panels.sidebar.visible).toBe(!initialVisible);
    });

    it('should set explicit sidebar visibility', () => {
      ideLayoutManager.toggleSidebar(false);
      expect(ideLayoutManager.getState().panels.sidebar.visible).toBe(false);
      ideLayoutManager.toggleSidebar(true);
      expect(ideLayoutManager.getState().panels.sidebar.visible).toBe(true);
    });

    it('should toggle terminal visibility', () => {
      const initialVisible = ideLayoutManager.getState().panels.terminal.visible;
      ideLayoutManager.toggleTerminal();
      expect(ideLayoutManager.getState().panels.terminal.visible).toBe(!initialVisible);
    });

    it('should set explicit terminal visibility', () => {
      ideLayoutManager.toggleTerminal(false);
      expect(ideLayoutManager.getState().panels.terminal.visible).toBe(false);
      ideLayoutManager.toggleTerminal(true);
      expect(ideLayoutManager.getState().panels.terminal.visible).toBe(true);
    });
  });

  describe('panel dimensions', () => {
    it('should set sidebar width within bounds', () => {
      ideLayoutManager.setSidebarWidth(400);
      expect(ideLayoutManager.getState().panels.sidebar.width).toBe(400);
    });

    it('should clamp sidebar width to min/max', () => {
      ideLayoutManager.setSidebarWidth(50);
      expect(ideLayoutManager.getState().panels.sidebar.width).toBe(100);
      ideLayoutManager.setSidebarWidth(1000);
      expect(ideLayoutManager.getState().panels.sidebar.width).toBe(800);
    });

    it('should set terminal height within bounds', () => {
      ideLayoutManager.setTerminalHeight(300);
      expect(ideLayoutManager.getState().panels.terminal.height).toBe(300);
    });

    it('should clamp terminal height to min/max', () => {
      ideLayoutManager.setTerminalHeight(50);
      expect(ideLayoutManager.getState().panels.terminal.height).toBe(100);
      ideLayoutManager.setTerminalHeight(600);
      expect(ideLayoutManager.getState().panels.terminal.height).toBe(500);
    });
  });

  describe('editor state', () => {
    it('should set active file', () => {
      const filePath = '/path/to/file.ts';
      ideLayoutManager.setActiveFile(filePath);
      expect(ideLayoutManager.getState().panels.editor.activeFile).toBe(filePath);
    });

    it('should clear active file', () => {
      ideLayoutManager.setActiveFile(null);
      expect(ideLayoutManager.getState().panels.editor.activeFile).toBeNull();
    });
  });

  describe('theme & display', () => {
    it('should set theme', () => {
      ideLayoutManager.setTheme('light');
      expect(ideLayoutManager.getState().theme).toBe('light');
      ideLayoutManager.setTheme('dark');
      expect(ideLayoutManager.getState().theme).toBe('dark');
    });

    it('should set font size within bounds', () => {
      ideLayoutManager.setFontSize(16);
      expect(ideLayoutManager.getState().fontSize).toBe(16);
    });

    it('should clamp font size to min/max', () => {
      ideLayoutManager.setFontSize(4);
      expect(ideLayoutManager.getState().fontSize).toBe(8);
      ideLayoutManager.setFontSize(40);
      expect(ideLayoutManager.getState().fontSize).toBe(32);
    });
  });

  describe('window state', () => {
    it('should toggle fullscreen', () => {
      const initialFullscreen = ideLayoutManager.getState().isFullscreen;
      ideLayoutManager.toggleFullscreen();
      expect(ideLayoutManager.getState().isFullscreen).toBe(!initialFullscreen);
    });

    it('should set window size', () => {
      ideLayoutManager.setWindowSize(1920, 1080);
      expect(ideLayoutManager.getState().windowSize).toEqual({
        width: 1920,
        height: 1080
      });
    });
  });

  describe('subscription management', () => {
    it('should notify subscribers of state changes', () => {
      const listener = vi.fn();
      ideLayoutManager.subscribe(listener);
      ideLayoutManager.toggleSidebar();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        panels: expect.objectContaining({
          sidebar: expect.objectContaining({
            visible: false
          })
        })
      }));
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = ideLayoutManager.subscribe(listener);
      unsubscribe();
      ideLayoutManager.toggleSidebar();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      ideLayoutManager.subscribe(listener1);
      ideLayoutManager.subscribe(listener2);
      ideLayoutManager.setTheme('light');
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Modifica vari aspetti dello stato
      ideLayoutManager.toggleSidebar(false);
      ideLayoutManager.setFontSize(20);
      ideLayoutManager.setTheme('light');
      ideLayoutManager.setActiveFile('test.ts');
      
      // Reset
      ideLayoutManager.reset();
      
      // Verifica che tutto sia tornato allo stato iniziale
      expect(ideLayoutManager.getState()).toEqual(INITIAL_STATE);
    });

    it('should notify subscribers on reset', () => {
      const listener = vi.fn();
      ideLayoutManager.subscribe(listener);
      ideLayoutManager.reset();
      expect(listener).toHaveBeenCalledWith(INITIAL_STATE);
    });
  });
}); 
 