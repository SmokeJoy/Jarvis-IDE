import { vi } from 'vitest';
/**
 * @file handlers.test.ts
 * @description Test per gli handler dei messaggi del modulo context-prompt
 * @author dev ai 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webviewBridge } from '@webview/utils/WebviewBridge';
import { ExtensionMessageType, WebviewMessageType } from '@shared/messages';
import { promptStateManager } from '../state';
import { 
  initializeMessageHandlers,
  sendProfileUpdateMessage,
  requestProfiles,
  sendPromptUpdateMessage
} from '../handlers';
import { DEFAULT_PROFILE, DEFAULT_PROMPTS } from '../constants';
import type { PromptProfile, ContextPrompt } from '../types';

// Mock del webviewBridge
vi.mock('@webview/utils/WebviewBridge', () => ({
  webviewBridge: {
    on: vi.fn(),
    sendMessage: vi.fn()
  }
}));

describe('Context Prompt Handlers', () => {
  beforeEach(() => {
    // Reset dei mock
    vi.clearAllMocks();
    // Reset dello stato
    promptStateManager.resetState();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initializeMessageHandlers', () => {
    it('should register handlers for promptProfiles and promptProfileUpdated messages', () => {
      initializeMessageHandlers();
      
      expect(webviewBridge.on).toHaveBeenCalledTimes(2);
      expect(webviewBridge.on).toHaveBeenCalledWith('promptProfiles', expect.any(Function));
      expect(webviewBridge.on).toHaveBeenCalledWith('promptProfileUpdated', expect.any(Function));
    });
  });

  describe('handlePromptProfilesMessage', () => {
    it('should update state and storage when receiving valid profiles', () => {
      // Setup
      const mockProfiles: PromptProfile[] = [
        { ...DEFAULT_PROFILE, id: 'test1' },
        { ...DEFAULT_PROFILE, id: 'test2', isDefault: false }
      ];

      // Simula il messaggio
      const handler = (webviewBridge.on as jest.Mock).mock.calls[0][1];
      handler({
        type: ExtensionMessageType.PROMPT_PROFILES,
        payload: { profiles: mockProfiles }
      });

      // Verifica lo stato
      expect(promptStateManager.getProfilesCache()).toEqual(mockProfiles);
      expect(promptStateManager.getActiveProfileId()).toBe('test1');
    });

    it('should ignore invalid messages', () => {
      // Setup
      const initialState = promptStateManager.getProfilesCache();

      // Simula un messaggio invalido
      const handler = (webviewBridge.on as jest.Mock).mock.calls[0][1];
      handler({ type: 'invalid' });

      // Verifica che lo stato non sia cambiato
      expect(promptStateManager.getProfilesCache()).toEqual(initialState);
    });
  });

  describe('handlePromptProfileUpdatedMessage', () => {
    it('should update profile in cache when receiving valid update', () => {
      // Setup
      const mockProfiles: PromptProfile[] = [
        { ...DEFAULT_PROFILE, id: 'test1' },
        { ...DEFAULT_PROFILE, id: 'test2' }
      ];
      promptStateManager.setProfilesCache(mockProfiles);
      promptStateManager.setActiveProfileId('test1');

      // Simula l'aggiornamento
      const updatedProfile = { 
        ...mockProfiles[0],
        name: 'Updated Profile'
      };

      const handler = (webviewBridge.on as jest.Mock).mock.calls[1][1];
      handler({
        type: ExtensionMessageType.PROMPT_PROFILE_UPDATED,
        payload: { profile: updatedProfile }
      });

      // Verifica l'aggiornamento
      const profiles = promptStateManager.getProfilesCache();
      expect(profiles?.find(p => p.id === 'test1')?.name).toBe('Updated Profile');
    });

    it('should update prompt cache when active profile is updated', () => {
      // Setup
      const mockProfiles: PromptProfile[] = [
        { ...DEFAULT_PROFILE, id: 'test1' },
        { ...DEFAULT_PROFILE, id: 'test2' }
      ];
      promptStateManager.setProfilesCache(mockProfiles);
      promptStateManager.setActiveProfileId('test1');

      // Simula l'aggiornamento con nuovi prompt
      const updatedPrompts: ContextPrompt = {
        ...DEFAULT_PROMPTS,
        system: 'Updated system prompt'
      };
      const updatedProfile = { 
        ...mockProfiles[0],
        contextPrompt: updatedPrompts
      };

      const handler = (webviewBridge.on as jest.Mock).mock.calls[1][1];
      handler({
        type: ExtensionMessageType.PROMPT_PROFILE_UPDATED,
        payload: { profile: updatedProfile }
      });

      // Verifica l'aggiornamento dei prompt
      expect(promptStateManager.getPromptCache().system).toBe('Updated system prompt');
    });
  });

  describe('sendProfileUpdateMessage', () => {
    it('should send correct message to extension', () => {
      const profile: PromptProfile = { ...DEFAULT_PROFILE, id: 'test' };
      sendProfileUpdateMessage(profile);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
        payload: { profile }
      });
    });
  });

  describe('requestProfiles', () => {
    it('should send correct message to extension', () => {
      requestProfiles();

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.GET_PROMPT_PROFILES
      });
    });
  });

  describe('sendPromptUpdateMessage', () => {
    it('should send correct message to extension', () => {
      const contextPrompt: ContextPrompt = { ...DEFAULT_PROMPTS };
      sendPromptUpdateMessage(contextPrompt);

      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.UPDATE_CONTEXT_PROMPT,
        payload: { contextPrompt }
      });
    });
  });
}); 
 