import React from "react";
import { render } from "@testing-library/react";
import { ChatMessageComponent } from "../ChatMessage";

describe("ChatMessageComponent MAS special events", () => {
  it("should render AGENT_ERROR message with proper badge", () => {
    const message = {
      id: "test-error",
      type: "event",
      eventType: "AGENT_ERROR",
      agentId: "ag1",
      text: "Errore agente: memoria terminata",
      timestamp: Date.now(),
      badgeType: "error",
      meta: {}
    };
    const { container, getByText } = render(<ChatMessageComponent message={message} />);
    expect(container).toMatchSnapshot();
    expect(getByText(/Errore agente/)).toBeTruthy();
    expect(container.querySelector('.badge-error')).not.toBeNull();
  });

  it("should render TASK_COMPLETED message with proper badge", () => {
    const message = {
      id: "test-task-done",
      type: "event",
      eventType: "TASK_COMPLETED",
      agentId: "ag1",
      text: "Il compito è stato completato con successo.",
      timestamp: Date.now(),
      badgeType: "success",
      meta: {}
    };
    const { container, getByText } = render(<ChatMessageComponent message={message} />);
    expect(container).toMatchSnapshot();
    expect(getByText(/completato/)).toBeTruthy();
    expect(container.querySelector('.badge-success')).not.toBeNull();
  });
});