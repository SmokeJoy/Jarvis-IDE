import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webviewBridge } from '@utils/WebviewBridge';
import { RouterMessageType } from '../types';
import {
  handleNavigate,
  handleOpenRoute,
  handleToggleSidebar,
  handleToggleTerminal,
  handleSetTheme,
  handleSetFontSize,
  messageHandlers
} from '../handlers';

// Mock del webviewBridge
vi.mock('@utils/WebviewBridge', () => ({
  webviewBridge: {
    sendMessage: vi.fn()
  }
}));

describe('Router Message Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleNavigate', () => {
    it('should send navigate message when receiving valid NAVIGATE message', () => {
      const message = {
        type: RouterMessageType.NAVIGATE,
        payload: {
          route: '/test',
          params: { id: '123' }
        }
      };

      handleNavigate(message);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'navigate',
        payload: {
          route: '/test',
          params: { id: '123' }
        }
      });
    });

    it('should not send message for non-NAVIGATE message type', () => {
      const message = {
        type: RouterMessageType.OPEN_ROUTE,
        payload: {
          route: '/test',
          params: { id: '123' }
        }
      };

      handleNavigate(message);

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleOpenRoute', () => {
    it('should send openRoute message when receiving valid OPEN_ROUTE message', () => {
      const message = {
        type: RouterMessageType.OPEN_ROUTE,
        payload: {
          route: '/test',
          params: { id: '123' }
        }
      };

      handleOpenRoute(message);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'openRoute',
        payload: {
          route: '/test',
          params: { id: '123' }
        }
      });
    });

    it('should not send message for non-OPEN_ROUTE message type', () => {
      const message = {
        type: RouterMessageType.NAVIGATE,
        payload: {
          route: '/test',
          params: { id: '123' }
        }
      };

      handleOpenRoute(message);

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleToggleSidebar', () => {
    it('should send toggleSidebar message when receiving valid TOGGLE_SIDEBAR message', () => {
      const message = {
        type: RouterMessageType.TOGGLE_SIDEBAR,
        payload: {
          visible: true
        }
      };

      handleToggleSidebar(message);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'toggleSidebar',
        payload: {
          visible: true
        }
      });
    });

    it('should not send message for non-TOGGLE_SIDEBAR message type', () => {
      const message = {
        type: RouterMessageType.NAVIGATE,
        payload: {
          visible: true
        }
      };

      handleToggleSidebar(message);

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleToggleTerminal', () => {
    it('should send toggleTerminal message when receiving valid TOGGLE_TERMINAL message', () => {
      const message = {
        type: RouterMessageType.TOGGLE_TERMINAL,
        payload: {
          visible: true
        }
      };

      handleToggleTerminal(message);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'toggleTerminal',
        payload: {
          visible: true
        }
      });
    });

    it('should not send message for non-TOGGLE_TERMINAL message type', () => {
      const message = {
        type: RouterMessageType.NAVIGATE,
        payload: {
          visible: true
        }
      };

      handleToggleTerminal(message);

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleSetTheme', () => {
    it('should send setTheme message when receiving valid SET_THEME message', () => {
      const message = {
        type: RouterMessageType.SET_THEME,
        payload: {
          theme: 'dark'
        }
      };

      handleSetTheme(message);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'setTheme',
        payload: {
          theme: 'dark'
        }
      });
    });

    it('should not send message for non-SET_THEME message type', () => {
      const message = {
        type: RouterMessageType.NAVIGATE,
        payload: {
          theme: 'dark'
        }
      };

      handleSetTheme(message);

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleSetFontSize', () => {
    it('should send setFontSize message when receiving valid SET_FONT_SIZE message', () => {
      const message = {
        type: RouterMessageType.SET_FONT_SIZE,
        payload: {
          size: 14
        }
      };

      handleSetFontSize(message);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'setFontSize',
        payload: {
          size: 14
        }
      });
    });

    it('should not send message for non-SET_FONT_SIZE message type', () => {
      const message = {
        type: RouterMessageType.NAVIGATE,
        payload: {
          size: 14
        }
      };

      handleSetFontSize(message);

      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('messageHandlers', () => {
    it('should have a handler for each RouterMessageType', () => {
      const messageTypes = Object.values(RouterMessageType);
      const handlerTypes = Object.keys(messageHandlers);

      expect(handlerTypes).toHaveLength(messageTypes.length);
      messageTypes.forEach(type => {
        expect(messageHandlers[type]).toBeDefined();
        expect(typeof messageHandlers[type]).toBe('function');
      });
    });
  });
}); 