import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OpenRouterModelPicker } from "./OpenRouterModelPicker.js";
import { OpenAiCompatibleModelInfo } from "../types/global.js";

describe("OpenRouterModelPicker", () => {
  const models: OpenAiCompatibleModelInfo[] = [
    {
      id: "model1",
      name: "Model 1",
      description: "Test model 1",
      maxTokens: 4096,
      contextWindow: 8192,
      temperature: 0.7,
      provider: "test",
    },
    {
      id: "model2",
      name: "Model 2",
      description: "Test model 2",
      maxTokens: 4096,
      contextWindow: 8192,
      temperature: 0.7,
      provider: "test",
    },
  ];

  test("renders loading state correctly", () => {
    render(
      <OpenRouterModelPicker
        selectedModel="model1"
        onChange={() => {}}
        models={[]}
        loading={true}
      />
    );
    expect(screen.getByText("Loading models...")).toBeInTheDocument();
  });

  test("renders error state correctly", () => {
    render(
      <OpenRouterModelPicker
        selectedModel="model1"
        onChange={() => {}}
        models={[]}
        error="Failed to load models"
      />
    );
    expect(screen.getByText("Failed to load models")).toBeInTheDocument();
  });

  test("renders models correctly", () => {
    render(
      <OpenRouterModelPicker
        selectedModel="model1"
        onChange={() => {}}
        models={models}
      />
    );
    expect(screen.getByText("Model 1")).toBeInTheDocument();
    expect(screen.getByText("Model 2")).toBeInTheDocument();
  });

  test("handles model selection correctly", () => {
    const handleChange = vi.fn();
    render(
      <OpenRouterModelPicker
        selectedModel="model1"
        onChange={handleChange}
        models={models}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "model2" },
    });

    expect(handleChange).toHaveBeenCalledWith("model2");
  });

  test("displays selected model correctly", () => {
    render(
      <OpenRouterModelPicker
        selectedModel="model2"
        onChange={() => {}}
        models={models}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("model2");
  });
}); 