import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMASMessage, handleMASErrorMessage } from '../mas-handlers';
import { MASMessage, MASErrorMessage } from '../../../types/mas.types';

describe('MAS Message Handlers', () => {
  let mockContext: {
    bridge: {
      sendMessage: (message: unknown) => void;
    };
    state: {
      updateMASState: (state: any) => void;
      setError: (error: string) => void;
    };
  };

  beforeEach(() => {
    mockContext = {
      bridge: {
        sendMessage: vi.fn()
      },
      state: {
        updateMASState: vi.fn(),
        setError: vi.fn()
      }
    };
  });

  describe('handleMASMessage', () => {
    it('should handle valid MAS state update message', () => {
      const validMessage: MASMessage = {
        type: 'masStateUpdate',
        payload: {
          agentId: 'agent1',
          state: {
            status: 'active',
            currentTask: 'processing',
            progress: 50
          }
        }
      };

      handleMASMessage(validMessage, mockContext);
      expect(mockContext.state.updateMASState).toHaveBeenCalledWith((msg.payload as unknown));
    });

    it('should handle MAS agent registration message', () => {
      const registrationMessage: MASMessage = {
        type: 'masAgentRegistered',
        payload: {
          agentId: 'newAgent',
          capabilities: ['coding', 'testing']
        }
      };

      handleMASMessage(registrationMessage, mockContext);
      expect(mockContext.bridge.sendMessage).toHaveBeenCalledWith({
        type: 'agentRegistrationConfirmed',
        payload: { agentId: 'newAgent' }
      });
    });

    it('should reject invalid MAS message structure', () => {
      const invalidMessage = {
        type: 'masStateUpdate',
        payload: { 
          invalidField: true 
        }
      };

      expect(() => handleMASMessage(invalidMessage, mockContext)).toThrow();
    });
  });

  describe('handleMASErrorMessage', () => {
    it('should handle MAS error message', () => {
      const errorMessage: MASErrorMessage = {
        type: 'masError',
        payload: {
          agentId: 'agent1',
          error: 'Task execution failed',
          details: 'Insufficient permissions'
        }
      };

      handleMASErrorMessage(errorMessage, mockContext);
      expect(mockContext.state.setError).toHaveBeenCalledWith(
        'MAS Error (agent1): Task execution failed - Insufficient permissions'
      );
    });

    it('should handle MAS error without details', () => {
      const errorMessage: MASErrorMessage = {
        type: 'masError',
        payload: {
          agentId: 'agent1',
          error: 'Connection lost'
        }
      };

      handleMASErrorMessage(errorMessage, mockContext);
      expect(mockContext.state.setError).toHaveBeenCalledWith(
        'MAS Error (agent1): Connection lost'
      );
    });

    it('should reject invalid error message structure', () => {
      const invalidMessage = {
        type: 'masError',
        payload: {
          error: 'Missing required agentId'
        }
      };

      expect(() => handleMASErrorMessage(invalidMessage, mockContext)).toThrow();
    });
  });
}); 
 