import React from 'react';
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ApiOptions from "../ApiOptions"
import { ExtensionStateContext } from "../../../context/ExtensionStateContext"
import { ExtensionState } from '../../../../../src/shared/types';
import { ApiOptions as ApiOptionsComponent } from '../ApiOptions';
import { ExtensionStateProvider } from '../../../context/ExtensionStateProvider';
import { ApiConfiguration } from '../../../types/extension';

const mockApiConfiguration: ApiConfiguration = {
	provider: 'openai',
	apiKey: '',
	modelId: 'gpt-3.5-turbo',
	modelName: 'GPT-3.5 Turbo'
};

const mockExtensionState = {
	version: '1.0.0',
	didHydrateState: true,
	showWelcome: false,
	shouldShowAnnouncement: false,
	telemetrySetting: 'enabled',
	customInstructions: '',
	chatSettings: {
		temperature: 0.7,
		maxTokens: 1000,
		contextLength: 4000
	},
	apiConfiguration: mockApiConfiguration,
	setApiConfiguration: jest.fn(),
	setCustomInstructions: jest.fn()
};

vi.mock("../../../context/ExtensionStateContext", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		useExtensionState: () => ({
			state: mockExtensionState,
			setState: jest.fn()
		})
	};
});

describe("ApiOptions", () => {
	it("renders without crashing", () => {
		render(<ApiOptionsComponent />);
		expect(screen.getByText('API Provider')).toBeInTheDocument();
	});

	it("shows provider dropdown", () => {
		render(<ApiOptionsComponent />);
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it("shows OpenAI options when OpenAI is selected", () => {
		render(<ApiOptionsComponent />);
		expect(screen.getByText('OpenAI API Key')).toBeInTheDocument();
	});

	it("renders Requesty API Key input", () => {
		render(
			<ExtensionStateContext.Provider value={mockExtensionState}>
				<ApiOptionsComponent showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>
		);
		const apiKeyInput = screen.getByPlaceholderText("Enter API Key...");
		expect(apiKeyInput).toBeInTheDocument();
	});

	it("renders Requesty Model ID input", () => {
		render(
			<ExtensionStateContext.Provider value={mockExtensionState}>
				<ApiOptionsComponent showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>,
		)
		const modelIdInput = screen.getByPlaceholderText("Enter Model ID...")
		expect(modelIdInput).toBeInTheDocument()
	})

	it("shows provider dropdown", () => {
		render(
			<ExtensionStateContext.Provider value={mockExtensionState}>
				<ApiOptionsComponent showModelOptions={true} setApiConfiguration={() => {}} />
			</ExtensionStateContext.Provider>
		);
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it("shows OpenAI options when OpenAI provider is selected", () => {
		render(
			<ExtensionStateContext.Provider value={mockExtensionState}>
				<ApiOptionsComponent showModelOptions={true} setApiConfiguration={() => {}} />
			</ExtensionStateContext.Provider>
		);
		expect(screen.getByLabelText(/OpenAI API Key/i)).toBeInTheDocument();
	});

	it("renders OpenAI API Key input when OpenAI is selected", () => {
		render(
			<ExtensionStateProvider>
				<ApiOptions />
			</ExtensionStateProvider>
		);
		expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
	});

	it("renders Anthropic API Key input when Anthropic is selected", () => {
		render(
			<ExtensionStateProvider>
				<ApiOptions />
			</ExtensionStateProvider>
		);
		const providerSelect = screen.getByLabelText('Provider');
		fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
		expect(screen.getByLabelText('Anthropic API Key')).toBeInTheDocument();
	});

	it("renders OpenRouter API Key input when OpenRouter is selected", () => {
		render(
			<ExtensionStateProvider>
				<ApiOptions />
			</ExtensionStateProvider>
		);
		const providerSelect = screen.getByLabelText('Provider');
		fireEvent.change(providerSelect, { target: { value: 'openrouter' } });
		expect(screen.getByLabelText('OpenRouter API Key')).toBeInTheDocument();
	});
})

vi.mock("../../../context/ExtensionStateContext", async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		// your mocked methods
		useExtensionState: vi.fn(() => ({
			apiConfiguration: {
				apiProvider: "together",
				requestyApiKey: "",
				requestyModelId: "",
			},
			setApiConfiguration: vi.fn(),
			uriScheme: "vscode",
		})),
	}
})

describe("ApiOptions Component", () => {
	vi.clearAllMocks()
	const mockPostMessage = vi.fn()

	beforeEach(() => {
		global.vscode = { postMessage: mockPostMessage } as any
	})

	it("renders Together API Key input", () => {
		render(
			<ExtensionStateContext.Provider value={{}}>
				<ApiOptions showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>,
		)
		const apiKeyInput = screen.getByPlaceholderText("Enter API Key...")
		expect(apiKeyInput).toBeInTheDocument()
	})

	it("renders Together Model ID input", () => {
		render(
			<ExtensionStateContext.Provider value={{}}>
				<ApiOptions showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>,
		)
		const modelIdInput = screen.getByPlaceholderText("Enter Model ID...")
		expect(modelIdInput).toBeInTheDocument()
	})
})

vi.mock("../../../context/ExtensionStateContext", async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		// your mocked methods
		useExtensionState: vi.fn(() => ({
			apiConfiguration: {
				apiProvider: "openai",
				requestyApiKey: "",
				requestyModelId: "",
			},
			setApiConfiguration: vi.fn(),
			uriScheme: "vscode",
		})),
	}
})

describe("OpenApiInfoOptions", () => {
	const mockPostMessage = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		global.vscode = { postMessage: mockPostMessage }
	})

	it("renders OpenAI Supports Images input", () => {
		render(
			<ExtensionStateContext.Provider value={{}}>
				<ApiOptions showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>,
		)
		fireEvent.click(screen.getByText("Model Configuration"))
		const apiKeyInput = screen.getByText("Supports Images")
		expect(apiKeyInput).toBeInTheDocument()
	})

	it("renders OpenAI Context Window Size input", () => {
		render(
			<ExtensionStateContext.Provider value={{}}>
				<ApiOptions showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>,
		)
		fireEvent.click(screen.getByText("Model Configuration"))
		const orgIdInput = screen.getByText("Context Window Size")
		expect(orgIdInput).toBeInTheDocument()
	})

	it("renders OpenAI Max Output Tokens input", () => {
		render(
			<ExtensionStateContext.Provider value={{}}>
				<ApiOptions showModelOptions={true} setApiConfiguration={vi.fn()} />
			</ExtensionStateContext.Provider>,
		)
		fireEvent.click(screen.getByText("Model Configuration"))
		const modelInput = screen.getByText("Max Output Tokens")
		expect(modelInput).toBeInTheDocument()
	})
})
