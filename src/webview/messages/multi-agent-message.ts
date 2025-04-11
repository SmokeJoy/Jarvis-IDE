import { WebviewMessage } from './webview-message';

export enum MultiAgentMessageType {
  AGENT_STATUS_UPDATED = 'agent_status_updated',
  AGENT_ERROR = 'agent_error'
}

export type MultiAgentMessageUnion = WebviewMessage<
  MultiAgentMessageType,
  {
    [MultiAgentMessageType.AGENT_STATUS_UPDATED]: {
      agents: Array<{
        id: string;
        name: string;
        active: boolean;
        lastPing: number;
      }>;
    };
    [MultiAgentMessageType.AGENT_ERROR]: {
      agentId: string;
      error: string;
      code: number;
    };
  }
>;