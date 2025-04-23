import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMCPMessage, handleMCPErrorMessage } from '../mcp-handlers';
import { MCPMessage, MCPErrorMessage } from '../../../types/mcp.types';

describe('MCP Message Handlers', () => {
  let mockContext: {
    bridge: {
      sendMessage: (message: unknown) => void;
    };
    state: {
      updateMCPState: (state: any) => void;
      setError: (error: string) => void;
      updateAgentState: (agentId: string, state: any) => void;
    };
  };

  beforeEach(() => {
    mockContext = {
      bridge: {
        sendMessage: vi.fn()
      },
      state: {
        updateMCPState: vi.fn(),
        setError: vi.fn(),
        updateAgentState: vi.fn()
      }
    };
  });

  describe('handleMCPMessage', () => {
    it('should handle MCP orchestration update', () => {
      const orchestrationMessage: MCPMessage = {
        type: 'mcpOrchestrationUpdate',
        payload: {
          orchestratorId: 'main',
          state: {
            activeAgents: ['agent1', 'agent2'],
            pendingTasks: 2,
            status: 'running'
          }
        }
      };

      handleMCPMessage(orchestrationMessage, mockContext);
      expect(mockContext.state.updateMCPState).toHaveBeenCalledWith((msg.payload as unknown));
    });

    it('should handle agent task assignment', () => {
      const taskMessage: MCPMessage = {
        type: 'mcpTaskAssigned',
        payload: {
          agentId: 'agent1',
          taskId: 'task123',
          taskType: 'codeReview',
          priority: 'high'
        }
      };

      handleMCPMessage(taskMessage, mockContext);
      expect(mockContext.state.updateAgentState).toHaveBeenCalledWith(
        'agent1',
        expect.objectContaining({
          currentTask: 'task123',
          taskType: 'codeReview'
        })
      );
    });

    it('should handle task completion notification', () => {
      const completionMessage: MCPMessage = {
        type: 'mcpTaskCompleted',
        payload: {
          agentId: 'agent1',
          taskId: 'task123',
          result: {
            status: 'success',
            changes: ['file1.ts', 'file2.ts']
          }
        }
      };

      handleMCPMessage(completionMessage, mockContext);
      expect(mockContext.bridge.sendMessage).toHaveBeenCalledWith({
        type: 'taskCompletionAcknowledged',
        payload: {
          taskId: 'task123',
          agentId: 'agent1'
        }
      });
    });

    it('should reject invalid MCP message structure', () => {
      const invalidMessage = {
        type: 'mcpOrchestrationUpdate',
        payload: {
          invalidField: true
        }
      };

      expect(() => handleMCPMessage(invalidMessage, mockContext)).toThrow();
    });
  });

  describe('handleMCPErrorMessage', () => {
    it('should handle orchestration error', () => {
      const errorMessage: MCPErrorMessage = {
        type: 'mcpError',
        payload: {
          orchestratorId: 'main',
          error: 'Orchestration failed',
          details: 'Agent coordination timeout'
        }
      };

      handleMCPErrorMessage(errorMessage, mockContext);
      expect(mockContext.state.setError).toHaveBeenCalledWith(
        'MCP Error: Orchestration failed - Agent coordination timeout'
      );
    });

    it('should handle task execution error', () => {
      const taskErrorMessage: MCPErrorMessage = {
        type: 'mcpError',
        payload: {
          orchestratorId: 'main',
          agentId: 'agent1',
          taskId: 'task123',
          error: 'Task execution failed',
          details: 'Resource unavailable'
        }
      };

      handleMCPErrorMessage(taskErrorMessage, mockContext);
      expect(mockContext.state.setError).toHaveBeenCalledWith(
        'MCP Error (Task task123): Task execution failed - Resource unavailable'
      );
      expect(mockContext.state.updateAgentState).toHaveBeenCalledWith(
        'agent1',
        expect.objectContaining({ status: 'error' })
      );
    });

    it('should reject invalid error message structure', () => {
      const invalidMessage = {
        type: 'mcpError',
        payload: {
          error: 'Missing required orchestratorId'
        }
      };

      expect(() => handleMCPErrorMessage(invalidMessage, mockContext)).toThrow();
    });
  });
}); 
 