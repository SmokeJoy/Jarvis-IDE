/**
 * @file webviewMessageUnion.test.ts
 * @description Test unitari per i type guards specifici definiti in webviewMessageUnion.ts
 */

import { describe, it, expect } from 'vitest';
import { WebviewMessageType, ActionType } from './webview.types';
import {
  isSendPromptMessage,
  isActionMessage,
  isErrorMessage,
  isResponseMessage,
  isStateMessage,
  isInstructionMessage,
  isInstructionCompletedMessage,
  safeCastAs,
  validators,
} from './webviewMessageUnion';

describe('Type guards specifici per WebviewMessage', () => {
  describe('isSendPromptMessage', () => {
    it('dovrebbe identificare correttamente un SendPromptMessage', () => {
      const message = {
        type: WebviewMessageType.SEND_PROMPT,
        payload: { prompt: 'Test prompt' },
      };

      expect(isSendPromptMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: 'action',
        action: 'chatButtonClicked' as ActionType,
      };

      expect(isSendPromptMessage(message)).toBe(false);
    });
  });

  describe('isActionMessage', () => {
    it('dovrebbe identificare correttamente un ActionMessage', () => {
      const message = {
        type: 'action',
        action: 'chatButtonClicked' as ActionType,
      };

      expect(isActionMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: WebviewMessageType.SEND_PROMPT,
      };

      expect(isActionMessage(message)).toBe(false);
    });
  });

  describe('isErrorMessage', () => {
    it('dovrebbe identificare correttamente un ErrorMessage', () => {
      const message = {
        type: 'error',
        error: 'Errore di test',
      };

      expect(isErrorMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: 'response',
      };

      expect(isErrorMessage(message)).toBe(false);
    });
  });

  describe('isResponseMessage', () => {
    it('dovrebbe identificare correttamente un ResponseMessage', () => {
      const message = {
        type: 'response',
        payload: { text: 'Risposta di test' },
      };

      expect(isResponseMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: 'state',
      };

      expect(isResponseMessage(message)).toBe(false);
    });
  });

  describe('isStateMessage', () => {
    it('dovrebbe identificare correttamente un StateMessage', () => {
      const message = {
        type: 'state',
        state: { use_docs: true },
      };

      expect(isStateMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: 'error',
      };

      expect(isStateMessage(message)).toBe(false);
    });
  });

  describe('isInstructionMessage', () => {
    it('dovrebbe identificare correttamente un InstructionMessage RECEIVED', () => {
      const message = {
        type: WebviewMessageType.INSTRUCTION_RECEIVED,
        id: '1',
        agentId: 'agent1',
      };

      expect(isInstructionMessage(message)).toBe(true);
    });

    it('dovrebbe identificare correttamente un InstructionMessage COMPLETED', () => {
      const message = {
        type: WebviewMessageType.INSTRUCTION_COMPLETED,
        id: '1',
        agentId: 'agent1',
      };

      expect(isInstructionMessage(message)).toBe(true);
    });

    it('dovrebbe identificare correttamente un InstructionMessage FAILED', () => {
      const message = {
        type: WebviewMessageType.INSTRUCTION_FAILED,
        id: '1',
        agentId: 'agent1',
      };

      expect(isInstructionMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: 'action',
      };

      expect(isInstructionMessage(message)).toBe(false);
    });
  });

  describe('isInstructionCompletedMessage', () => {
    it('dovrebbe identificare correttamente un InstructionCompletedMessage', () => {
      const message = {
        type: 'instructionCompleted',
        id: '1',
        agentId: 'agent1',
        instruction: 'Test instruction',
        result: 'Test result',
      };

      expect(isInstructionCompletedMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare messaggi di altro tipo', () => {
      const message = {
        type: 'instructionFailed',
      };

      expect(isInstructionCompletedMessage(message)).toBe(false);
    });
  });
});

describe('safeCastAs', () => {
  it('dovrebbe eseguire un cast normale quando non viene fornito un validatore', () => {
    const obj = { type: 'test', value: 42 };
    const result = safeCastAs<{ type: string; value: number }>(obj);

    expect(result).toEqual(obj);
  });

  it('dovrebbe restituire il valore castato quando la validazione ha successo', () => {
    const obj = { type: WebviewMessageType.SEND_PROMPT, payload: { prompt: 'test' } };
    const result = safeCastAs(obj, validators.isSendPrompt);

    expect(result).toEqual(obj);
  });

  it('dovrebbe restituire null quando la validazione fallisce', () => {
    const obj = { type: 'error', error: 'test error' };
    const result = safeCastAs(obj, validators.isSendPrompt);

    expect(result).toBeNull();
  });

  it('dovrebbe gestire correttamente valori null o undefined', () => {
    expect(safeCastAs(null, validators.isSendPrompt)).toBeNull();
    expect(safeCastAs(undefined, validators.isSendPrompt)).toBeNull();
  });
});

describe('Validatori', () => {
  it('isSendPrompt dovrebbe identificare correttamente un SendPromptMessage', () => {
    const message = {
      type: WebviewMessageType.SEND_PROMPT,
      payload: { prompt: 'test' },
    };

    expect(validators.isSendPrompt(message)).toBe(true);
    expect(validators.isSendPrompt({ type: 'error' })).toBe(false);
  });

  it('isAction dovrebbe identificare correttamente un ActionMessage', () => {
    const message = {
      type: 'action',
      action: 'chatButtonClicked',
    };

    expect(validators.isAction(message)).toBe(true);
    expect(validators.isAction({ type: 'error' })).toBe(false);
  });

  it('isError dovrebbe identificare correttamente un ErrorMessage', () => {
    const message = {
      type: 'error',
      error: 'test error',
    };

    expect(validators.isError(message)).toBe(true);
    expect(validators.isError({ type: 'action' })).toBe(false);
  });

  it('isResponse dovrebbe identificare correttamente un ResponseMessage', () => {
    const message = {
      type: 'response',
      payload: { text: 'test response' },
    };

    expect(validators.isResponse(message)).toBe(true);
    expect(validators.isResponse({ type: 'action' })).toBe(false);
  });

  it('isState dovrebbe identificare correttamente un StateMessage', () => {
    const message = {
      type: 'state',
      state: { use_docs: true },
    };

    expect(validators.isState(message)).toBe(true);
    expect(validators.isState({ type: 'action' })).toBe(false);
  });
});
