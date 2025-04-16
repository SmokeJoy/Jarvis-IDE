import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AgentFlowDebugger from "../AgentFlowDebugger";
import * as useAgentTypingStateModule from "../../../hooks/useAgentTypingState";

// Helper per simulare il WebviewMessageUnion
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

describe("AgentFlowDebugger typing badge MAS timeline", () => {
  const agentA = { id: "agent-A", name: "Agent A", type: "planner", status: "active" };
  const agentB = { id: "agent-B", name: "Agent B", type: "searcher", status: "waiting" };
  const threadId1 = "thread-1";
  const threadId2 = "thread-2";
  const now = new Date().toISOString();
  const baseFlow = {
    agents: [agentA, agentB],
    interactions: [
      {
        id: "int-1",
        sourceId: agentA.id,
        targetId: agentB.id,
        type: "request",
        label: "Richiesta",
        content: "Msg 1",
        timestamp: now,
        threadId: threadId1,
      },
      {
        id: "int-2",
        sourceId: agentB.id,
        targetId: agentA.id,
        type: "response",
        label: "Risposta",
        content: "Msg 2",
        timestamp: now,
        threadId: threadId2,
      },
    ],
  };
  const filters = {
    search: "",
    status: [],
    interactionType: [],
    timeRange: null,
    zoom: 100,
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("mostra badge di typing solo sull'agente e thread corretti dopo sequenza eventi typing", () => {
    // MAS multi-typing: A thread-1 typing, B thread-2 typing
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": true },
      [threadId2]: { "agent-B": true },
    });
    render(<AgentFlowDebugger flow={baseFlow} filters={filters} />);
    const typingBadges = screen.getAllByText(/✎/);
    expect(typingBadges.length).toBeGreaterThan(1);
    expect(
      screen.getByText(/Agent A/).parentElement.innerHTML.match(/✎/)
    ).toBeTruthy();
    expect(
      screen.getByText(/Agent B/).parentElement.innerHTML.match(/✎/)
    ).toBeTruthy();
  });

  it("toglie il badge typing se arriva AGENT_TYPING_DONE per agent-A", () => {
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": false },
      [threadId2]: { "agent-B": true },
    });
    render(<AgentFlowDebugger flow={baseFlow} filters={filters} />);
    // Il badge typing NON deve essere visibile accanto ad agent-A
    expect(screen.getByText(/Agent A/).parentElement.innerHTML.match(/✎/)).toBeNull();
    // Deve essere ancora visibile per agent-B
    expect(screen.getByText(/Agent B/).parentElement.innerHTML.match(/✎/)).toBeTruthy();
  });

  it("renderizza nessun badge typing se tutti AGENT_TYPING_DONE", () => {
    vi.spyOn(useAgentTypingStateModule, "useAgentTypingState").mockReturnValue({
      [threadId1]: { "agent-A": false },
      [threadId2]: { "agent-B": false },
    });
    render(<AgentFlowDebugger flow={baseFlow} filters={filters} />);
    expect(screen.queryByText(/✎/)).toBeNull();
  });
});