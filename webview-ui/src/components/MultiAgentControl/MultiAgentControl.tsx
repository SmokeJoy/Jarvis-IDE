import React, { useEffect, useState } from 'react';
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import { useExtensionMessage } from '@/hooks/useExtensionMessage';
import { useExtensionState } from '../../context/ExtensionStateContext';
import { isAgentErrorMessage } from '@/utils/guards/agent-message-guards';

type AgentStatus = {
  id: string;
  name: string;
  active: boolean;
};

type MultiAgentMessage =
  | { type: 'TOGGLE_AGENT'; payload: { agentId: string; activate: boolean } }
  | { type: 'agentError'; payload: { agentId: string; error: string } };

export const MultiAgentControl: React.FC = () => {
  const { state } = useExtensionState();
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: 'planner', name: 'Planner', active: true },
    { id: 'developer', name: 'Developer', active: true },
    { id: 'reviewer', name: 'Reviewer', active: false },
  ]);

  useExtensionMessage((message: unknown) => {
    if (isAgentErrorMessage(message)) {
      console.error(`Errore agente ${(msg.payload as unknown).agentId}:`, (msg.payload as unknown).error);
    }
  });

  const handleToggle = (agentId: string) => {
    const updatedAgents = agents.map((a) =>
      a.id === agentId ? { ...a, active: !a.active } : a
    );
    setAgents(updatedAgents);

    const msg: MultiAgentMessage = {
      type: 'TOGGLE_AGENT',
      payload: { agentId, activate: !agents.find((a) => a.id === agentId)?.active },
    };
    window.vscode?.postMessage(msg);
  };

  return (
    <section>
      <h3>Agenti Abilitati</h3>
      {agents.map((agent) => (
        <VSCodeCheckbox
          key={agent.id}
          checked={agent.active}
          onChange={() => handleToggle(agent.id)}
        >
          {agent.name}
        </VSCodeCheckbox>
      ))}
    </section>
  );
}; 