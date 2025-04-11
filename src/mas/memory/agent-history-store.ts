export interface AgentHistoryItem {
  prompt: string;
  response: string;
  timestamp: number;
}

export interface AgentHistoryStore {
  save(agentId: string, entry: AgentHistoryItem): void;
  getRecent(agentId: string, limit?: number): AgentHistoryItem[];
  getLast(agentId: string): AgentHistoryItem | null;
  clear(agentId: string): void;
}