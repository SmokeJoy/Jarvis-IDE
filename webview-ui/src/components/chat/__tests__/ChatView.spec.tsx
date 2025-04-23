import React from "react";
import { render, screen, act } from "@testing-library/react";
import { ChatView } from "../ChatView";
import { agentEventToChatMessage } from "../AgentMessageFactory";
import { createFakeResponseMessage, createFakeTypingMessage, createFakeTypingDoneMessage } from '../../../../test/__factories__/messages';

describe("ChatView MAS end-to-end events", () => {
  it("should render a MAS event badge and content when MAS event is dispatched", async () => {
    // Mock props
    const apiConfiguration = { apiKey: "test", endpoint: "test" };
    const hideAnnouncement = jest.fn();
    const showHistoryView = jest.fn();
    // Render ChatView
    render(
      <ChatView
        apiConfiguration={apiConfiguration}
        isHidden={false}
        showAnnouncement={false}
        hideAnnouncement={hideAnnouncement}
        showHistoryView={showHistoryView}
        isEnabled={true}
      />
    );
    // Simula la ricezione di un evento MAS
    const event = {
      type: "AGENT_ERROR",
      agentId: "parser",
      timestamp: Date.now(),
      text: "Memoria insufficiente"
    };
    const msg = agentEventToChatMessage(event);
    screen.getByText && screen.getByText(msg.text);
    await waitFor(() => {
      expect(screen.getByText(/parser/)).toBeInTheDocument();
      expect(screen.getByText(/parser/).className.includes("badge-error")).toBe(true);
      expect(screen.getByText(/Errore agente|Memoria insufficiente/i)).toBeTruthy();
    });
  });

  it("should group messages by threadId and display badges for each agent", () => {
    const apiConfiguration = { apiKey: "test", endpoint: "test" };
    const hideAnnouncement = jest.fn();
    const showHistoryView = jest.fn();
    const multiThreadMessages = [
      {
        id: "1", role: "user", parts: [{ type: "text", content: "Domanda 1" }], agentId: "coder", threadId: "t-coding", timestamp: "2024-05-31T10:00:00Z"
      },
      {
        id: "2", role: "assistant", parts: [{ type: "text", content: "Risposta 1" }], agentId: "coder", threadId: "t-coding", timestamp: "2024-05-31T10:00:10Z"
      },
      {
        id: "3", role: "user", parts: [{ type: "text", content: "Domanda 2" }], agentId: "planner", threadId: "t-plan", timestamp: "2024-05-31T10:01:00Z"
      },
      {
        id: "4", role: "assistant", parts: [{ type: "text", content: "Risposta 2" }], agentId: "planner", threadId: "t-plan", timestamp: "2024-05-31T10:01:12Z"
      },
      {
        id: "5", role: "system", parts: [{ type: "text", content: "Messaggio di sistema ⚠️" }], agentId: "explainer", threadId: "t-explain", timestamp: "2024-05-31T10:02:00Z"
      }
    ];
    // Stub context/state se necessario, oppure mocka lo stato direttamente
    // Render con i messaggi multi-thread
    render(
      <ChatView
        apiConfiguration={apiConfiguration}
        isHidden={false}
        showAnnouncement={false}
        hideAnnouncement={hideAnnouncement}
        showHistoryView={showHistoryView}
        isEnabled={true}
                messages={multiThreadMessages}
      />
    );
    expect(screen.getAllByText(/Thread:/i).length).toBeGreaterThan(1);
    expect(screen.getByText(/Thread: t-coding/)).toBeInTheDocument();
    expect(screen.getByText(/coder/)).toBeInTheDocument();
    expect(screen.getByText(/planner/)).toBeInTheDocument();
    expect(screen.getByText(/explainer/)).toBeInTheDocument();
    expect(screen.getByText(/Domanda 1/)).toBeInTheDocument();
    expect(screen.getByText(/Risposta 1/)).toBeInTheDocument();
    expect(screen.getByText(/Domanda 2/)).toBeInTheDocument();
    expect(screen.getByText(/Risposta 2/)).toBeInTheDocument();
    expect(screen.getByText(/Messaggio di sistema/)).toBeInTheDocument();
  });
  it("visualizza un indicatore di typing per ciascun threadId e badge agente in typing", () => {
    const apiConfiguration = { apiKey: "test", endpoint: "test" };
    const hideAnnouncement = jest.fn();
    const showHistoryView = jest.fn();
    // 2 thread, due agenti diversi typing
    const messaggi = [
      { id: "1", role: "user", parts: [{ type: "text", content: "Domanda 1" }], agentId: "coder", threadId: "t-coding", timestamp: Date.now() },
      { id: "2", role: "assistant", parts: [{ type: "text", content: "Risposta 1" }], agentId: "coder", threadId: "t-coding", timestamp: Date.now() + 1000 },
      { id: "3", role: "user", parts: [{ type: "text", content: "Domanda 2" }], agentId: "planner", threadId: "t-plan", timestamp: Date.now() + 2000 }
    ];
    // Simula stato agentTypingState attivo per due thread e agent diversi
    const agentTypingState = {
      "t-coding": { coder: true },
      "t-plan": { planner: true }
    };
    render(
      <ChatView
        apiConfiguration={apiConfiguration}
        isHidden={false}
        showAnnouncement={false}
        hideAnnouncement={hideAnnouncement}
        showHistoryView={showHistoryView}
        isEnabled={true}
                messages={messaggi}
                agentTypingState={agentTypingState}
      />
    );
    // Verifica indicatori
    expect(screen.getByText(/coder/)).toBeInTheDocument();
    expect(screen.getByText(/sta scrivendo/)).toBeInTheDocument();
    expect(screen.getAllByText(/sta scrivendo/).length).toBe(2);
    expect(screen.getByText(/planner/)).toBeInTheDocument();
  });
  it("rimuove l'indicatore di typing quando AGENT_TYPING_DONE viene inviato", () => {
    const apiConfiguration = { apiKey: "test", endpoint: "test" };
    const hideAnnouncement = jest.fn();
    const showHistoryView = jest.fn();
    const messaggi = [
      { id: "1", role: "user", parts: [{ type: "text", content: "Domanda" }], agentId: "coder", threadId: "t-main", timestamp: Date.now() }
    ];
    let agentTypingState = { "t-main": { coder: true } };
    const { rerender } = render(
      <ChatView
        apiConfiguration={apiConfiguration}
        isHidden={false}
        showAnnouncement={false}
        hideAnnouncement={hideAnnouncement}
        showHistoryView={showHistoryView}
        isEnabled={true}
                messages={messaggi}
        agentTypingState={agentTypingState}
      />
    );
    expect(screen.getByText(/sta scrivendo/)).toBeInTheDocument();
    // Simula update: typing terminato
    agentTypingState = { "t-main": { coder: false } };
    rerender(
      <ChatView
        apiConfiguration={apiConfiguration}
        isHidden={false}
        showAnnouncement={false}
        hideAnnouncement={hideAnnouncement}
        showHistoryView={showHistoryView}
        isEnabled={true}
                messages={messaggi}
        agentTypingState={agentTypingState}
      />
    );
    expect(screen.queryByText(/sta scrivendo/)).toBeNull();
  });
});