// Factory centralizzata per la creazione di ChatMessage da eventi MAS
import { ChatMessage } from '../../types/webview';

export type AgentEvent = {
  type: string;
  agentId: string;
  timestamp: number;
  [key: string]: any;
};

// Mappa evento->badge dinamica
const badgeTypeByEvent: Record<string, { badgeType: string; label: string }> = {
  AGENT_ERROR: { badgeType: 'error', label: '⚠️ Errore agente' },
  TASK_COMPLETED: { badgeType: 'success', label: '✅ Attività completata' },
  // Estendi per altri eventi...
};

export function agentEventToChatMessage(event: AgentEvent): ChatMessage {
  const base = badgeTypeByEvent[event.type] || { badgeType: 'default', label: event.type };
  return {
    id: `agent-${event.type}-${Date.now()}`,
    role: 'assistant',
    type: 'event',
    eventType: event.type,
    agentId: event.agentId,
    timestamp: event.timestamp || Date.now(),
    badgeType: base.badgeType,
    text: base.label + (event.text ? `: ${event.text}` : ''),
    parts: [
      { type: 'text', content: base.label + (event.text ? `: ${event.text}` : '') }
    ],
    meta: event.meta || {}
  };
}