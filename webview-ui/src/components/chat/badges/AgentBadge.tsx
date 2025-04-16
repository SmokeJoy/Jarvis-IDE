import React from 'react';

interface AgentBadgeProps {
  agentId: string;
  eventType?: string;
  isTyping?: boolean;
}

const badgeTypeMap: Record<string, { className: string; icon: string }> = {
  AGENT_ERROR: { className: 'badge-error', icon: '⚠️' },
  TASK_COMPLETED: { className: 'badge-success', icon: '✅' },
  // Altri tipi di evento MAS...
};

export const AgentBadge: React.FC<AgentBadgeProps> = ({ agentId, eventType, isTyping }) => {
  const config = eventType && badgeTypeMap[eventType] ? badgeTypeMap[eventType] : { className: 'badge-default', icon: '' };
  return (
    <span className={`agent-badge ${config.className}`}
          data-agentid={agentId}
          data-eventtype={eventType || ''}>
      {config.icon} {agentId}
      {isTyping ? (
        <span className="agent-badge-typing animate-ellipsis" title="sta scrivendo...">&nbsp;<span className="typing-symbol">✎</span> <span className="typing-ellipsis"><span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></span></span>
      ) : null}
    </span>
  );
};