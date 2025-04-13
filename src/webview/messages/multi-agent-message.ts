import { WebviewMessage } from '../../shared/types/webview.types';

export enum MultiAgentMessageType {
  REQUEST_AGENT_STATUS = 'requestAgentStatus',
  TOGGLE_AGENT = 'toggleAgent',
  AGENT_STATUS_UPDATE = 'agentStatusUpdate',
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error';
  memory?: Record<string, any>;
}

export interface RequestAgentStatusMessage
  extends WebviewMessage<MultiAgentMessageType.REQUEST_AGENT_STATUS> {
  type: MultiAgentMessageType.REQUEST_AGENT_STATUS;
}

export interface ToggleAgentMessage extends WebviewMessage<MultiAgentMessageType.TOGGLE_AGENT> {
  type: MultiAgentMessageType.TOGGLE_AGENT;
  payload: {
    agentId: string;
    enabled: boolean;
  };
}

export interface AgentStatusUpdateMessage
  extends WebviewMessage<MultiAgentMessageType.AGENT_STATUS_UPDATE> {
  type: MultiAgentMessageType.AGENT_STATUS_UPDATE;
  payload: {
    agents: AgentStatus[];
  };
}

export type MultiAgentMessage =
  | RequestAgentStatusMessage
  | ToggleAgentMessage
  | AgentStatusUpdateMessage;
