/**
 * @file contextPromptManager.test.ts
 * @description Test Jest per contextPromptManager — verifica comportamenti edge MAS context prompt
 */

import contextPromptManager from '../../src/mas/contextPromptManager';

// Mock veriabili e helper se necessario

describe('contextPromptManager', () => {
  it('dovrebbe gestire il set e get dei prompt contestuali', () => {
    // Arrange
    const prompt = 'Prompt test';
    contextPromptManager.setPrompt(prompt);
    // Act
    const result = contextPromptManager.getPrompt();
    // Assert
    expect(result).toBe(prompt);
  });

  it('dovrebbe restituire null se il prompt non è mai stato settato', () => {
    // Arrange
    contextPromptManager.clearPrompt();
    // Act
    const result = contextPromptManager.getPrompt();
    // Assert
    expect(result).toBeNull();
  });

  it('deve gestire i casi edge di override rapido', () => {
    contextPromptManager.setPrompt('uno');
    contextPromptManager.setPrompt('due');
    expect(contextPromptManager.getPrompt()).toBe('due');
  });

  // Puoi estendere qui con snapshot se la struttura evolve
});