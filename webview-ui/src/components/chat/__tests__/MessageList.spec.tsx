import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { MessageList } from "../MessageList";
import * as useAgentTypingStateModule from "../../../hooks/useAgentTypingState";
import AgentBadge from "../badges/AgentBadge";

const AGENT_TYPING_EVENT = (agentId, threadId) => ({
  type: "AGENT_TYPING",
  agentId,
  threadId,
  timestamp: Date.now(),
});
const AGENT_TYPING_DONE_EVENT = (agentId, threadId) => ({
  type: "AGENT_TYPING_DONE",
  agentId,
  threadId,
  timestamp: Date.now(),
});

describe("MessageList typing badge MAS chat", () => {
  const agentA = { id: "agent-A", name: "Agent A" };
  const agentB = { id: "agent-B", name: "Agent B" };
  const threadId1 = "thread-1";
  const threadId2 = "thread-2";
  const now = new Date().toISOString();

  const makeMessages = () => ([
    { id: "msg-1", agentId: "agent-A", threadId: threadId1, content: "Ciao da A", createdAt: now },
    { id: "msg-2", agentId: "agent-B", threadId: threadId1, content: "Risposta da B", createdAt: now },
    { id: "msg-3", agentId: "agent-B", threadId: threadId2, content: "Inizio nuova thread", createdAt: now }
  ]);

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("mostra badge typing soltanto accanto ai messaggi con agentId/threadId giusti", () => {
    // agent-A sta scrivendo in thread-1, agent-B in thread-2
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": true },
      [threadId2]: { "agent-B": true }
    });
    render(
      <MessageList
        messages={makeMessages()}
        agentTypingState={{
          [threadId1]: { "agent-A": true },
          [threadId2]: { "agent-B": true }
        }}
      />
    );
    // Deve mostrare badge typing per agent-A su thread-1 e agent-B su thread-2
    const allTypingBadges = screen.getAllByText(/✎/);
    expect(allTypingBadges.length).toBeGreaterThan(1);
    expect(screen.getByText("Ciao da A").parentElement.innerHTML.match(/✎/)).toBeTruthy();
    expect(screen.getByText("Inizio nuova thread").parentElement.innerHTML.match(/✎/)).toBeTruthy();
  });

  it("toglie il badge typing se arriva AGENT_TYPING_DONE per agent-A su thread-1", () => {
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": false },
      [threadId2]: { "agent-B": true }
    });
    render(
      <MessageList
        messages={makeMessages()}
        agentTypingState={{
          [threadId1]: { "agent-A": false },
          [threadId2]: { "agent-B": true }
        }}
      />
    );
    // Il badge typing NON deve essere più visibile accanto a Ciao da A (agent-A @ thread-1)
    expect(screen.getByText("Ciao da A").parentElement.innerHTML.match(/✎/)).toBeNull();
    // Deve restare visibile per agent-B su thread-2
    expect(screen.getByText("Inizio nuova thread").parentElement.innerHTML.match(/✎/)).toBeTruthy();
  });

  it("rimuove tutti i badge typing se tutti hanno done", () => {
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": false },
      [threadId2]: { "agent-B": false }
    });
    render(
      <MessageList
        messages={makeMessages()}
        agentTypingState={{
          [threadId1]: { "agent-A": false },
          [threadId2]: { "agent-B": false }
        }}
      />
    );
    expect(screen.queryByText(/✎/)).toBeNull();
  });

  it("badge typing rispetta la struttura thread+agent e non appare per messaggi sbagliati", () => {
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-B": true } // agent-B sta scrivendo ma su thread-1, nessuno su msg-3
    });
    render(
      <MessageList
        messages={makeMessages()}
        agentTypingState={{
          [threadId1]: { "agent-B": true }
        }}
      />
    );
    // Non deve comparire badge typing su msg-3 (thread-2)
    expect(screen.getByText("Inizio nuova thread").parentElement.innerHTML.match(/✎/)).toBeNull();
  });

  it("badge typing accessibile: aria-label presente se attivo", () => {
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": true }
    });
    render(
      <MessageList
        messages={makeMessages()}
        agentTypingState={{
          [threadId1]: { "agent-A": true }
        }}
      />
    );
    // Badge AgentBadge deve avere aria-label="typing"
    const badge = screen.getByText(/✎/).closest('[aria-label="typing"]');
    expect(badge).not.toBeNull();
  });
});