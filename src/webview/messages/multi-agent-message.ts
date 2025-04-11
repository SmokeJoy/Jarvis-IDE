import { WebviewMessage } from './webview-message';

export enum MultiAgentMessageType {
  REQUEST_AGENT_STATUS = 'requestAgentStatus',
  AGENT_STATUS_UPDATED = 'agentStatusUpdated',
  TOGGLE_AGENT = 'toggleAgent',
  AGENT_ERROR = 'agentError',
  SYNC_AGENTS = 'syncAgents'
}

export type MultiAgentMessageUnion = WebviewMessage<
  MultiAgentMessageType,
  {
    [MultiAgentMessageType.REQUEST_AGENT_STATUS]: undefined,
    [MultiAgentMessageType.AGENT_STATUS_UPDATED]: {
      agents: Array<{
        id: string;
        name: string;
        active: boolean;
        lastPing: number;
      }>;
    },
    [MultiAgentMessageType.TOGGLE_AGENT]: {
      agentId: string;
      activate: boolean;
    },
    [MultiAgentMessageType.AGENT_ERROR]: {
      agentId: string;
      error: string;
      code: number;
    },
    [MultiAgentMessageType.SYNC_AGENTS]: {
      timestamp: number;
    }
  }
>;