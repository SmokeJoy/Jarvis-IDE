import React, { useCallback, useEffect, useState, memo, FormEvent } from 'react'
import {
	VSCodeButton,
	VSCodeCheckbox,
	VSCodeDropdown,
	VSCodeOption,
	VSCodeTextField,
	VSCodeTextArea,
	VSCodeDivider,
	VSCodePanels,
	VSCodePanelTab,
	VSCodePanelView
} from '@vscode/webview-ui-toolkit/react'
import { useEvent, useInterval } from 'react-use'
import styled from 'styled-components'
import { ApiConfiguration, OpenAiCompatibleModelInfo, WebviewMessage } from '../../../src/types/extension'
import { useExtensionState } from '../context/ExtensionStateContext'
import { vscode } from '../utils/vscode'
import { getAsVar, VSC_DESCRIPTION_FOREGROUND } from '../utils/vscStyles'
import VSCodeButtonLink from '../components/common/VSCodeButtonLink'
import { OpenRouterModelPicker } from './OpenRouterModelPicker'
import { ModelDescriptionMarkdown } from './ModelDescriptionMarkdown'
import { JarvisAccountInfoCard } from './JarvisAccountInfoCard'
import { ModelInfoView } from './ModelInfoView'
import { normalizeApiConfiguration } from './utils'
import { ThinkingBudgetSlider } from './ThinkingBudgetSlider'
import { validateApiConfiguration } from '../utils/validateApiConfiguration'
import { OpenAiModelPicker } from './OpenAiModelPicker'
import { AnthropicModelPicker } from './AnthropicModelPicker'
import { GeminiModelPicker } from './GeminiModelPicker'
import { MistralModelPicker } from './MistralModelPicker'
import { LLMStudioModelPicker } from './LLMStudioModelPicker'
import { OllamaModelPicker } from './OllamaModelPicker'

// Z-index per il dropdown
const OPENROUTER_MODEL_PICKER_Z_INDEX = 10;

interface ApiOptionsProps {
	showModelOptions: boolean
	apiErrorMessage?: string
	modelIdErrorMessage?: string
	isPopup?: boolean
	setApiConfiguration: (config: ApiConfiguration) => void
}

// This is necessary to ensure dropdown opens downward, important for when this is used in popup
const DROPDOWN_Z_INDEX = OPENROUTER_MODEL_PICKER_Z_INDEX + 2 // Higher than the OpenRouterModelPicker's and ModelSelectorTooltip's z-index

export const DropdownContainer = styled.div<{ zIndex?: number }>`
	position: relative;
	z-index: ${(props) => props.zIndex || DROPDOWN_Z_INDEX};

	// Force dropdowns to open downward
	& vscode-dropdown::part(listbox) {
		position: absolute !important;
		top: 100% !important;
		bottom: auto !important;
	}
`

declare module "vscode" {
	interface LanguageModelChatSelector {
		vendor?: string
		family?: string
		version?: string
		id?: string
	}
}

const ApiOptions = memo(({ showModelOptions, apiErrorMessage, modelIdErrorMessage, isPopup, setApiConfiguration }: ApiOptionsProps) => {
	const { apiConfiguration, uriScheme } = useExtensionState()
	const [ollamaModels, setOllamaModels] = useState<string[]>([])
	const [lmStudioModels, setLmStudioModels] = useState<string[]>([])
	const [vsCodeLmModels, setVsCodeLmModels] = useState<vscode.LanguageModelChatSelector[]>([])
	const [anthropicBaseUrlSelected, setAnthropicBaseUrlSelected] = useState(!!apiConfiguration?.anthropicBaseUrl)
	const [azureApiVersionSelected, setAzureApiVersionSelected] = useState(!!apiConfiguration?.azureApiVersion)
	const [awsEndpointSelected, setAwsEndpointSelected] = useState(!!apiConfiguration?.awsBedrockEndpoint)
	const [modelConfigurationSelected, setModelConfigurationSelected] = useState(false)
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
	const [providerSortingSelected, setProviderSortingSelected] = useState(!!apiConfiguration?.openRouterProviderSorting)
	const [validationErrors, setValidationErrors] = useState<string[]>([])

	const handleInputChange = useCallback((field: keyof ApiConfiguration) => (event: FormEvent<HTMLInputElement>) => {
		const newConfig = {
			...apiConfiguration,
			[field]: event.currentTarget.value
		}
		setApiConfiguration(newConfig)
		const errors = validateApiConfiguration(newConfig)
		setValidationErrors(errors)
	}, [apiConfiguration, setApiConfiguration])

	const handleCheckboxChange = useCallback((field: keyof ApiConfiguration) => (event: FormEvent<HTMLInputElement>) => {
		const newConfig = {
			...apiConfiguration,
			[field]: event.currentTarget.checked
		}
		setApiConfiguration(newConfig)
		const errors = validateApiConfiguration(newConfig)
		setValidationErrors(errors)
	}, [apiConfiguration, setApiConfiguration])

	const handleModelInfoChange = useCallback((modelInfo: OpenAiCompatibleModelInfo) => {
		const newConfig = {
			...apiConfiguration,
			openRouterModelInfo: modelInfo,
			openRouterModelId: modelInfo.id
		}
		setApiConfiguration(newConfig)
		const errors = validateApiConfiguration(newConfig)
		setValidationErrors(errors)
	}, [apiConfiguration, setApiConfiguration])

	// Poll ollama/lmstudio models
	const requestLocalModels = useCallback(() => {
		if (apiConfiguration.provider === "ollama") {
			vscode.postMessage({
				type: "requestOllamaModels",
				payload: apiConfiguration?.ollamaBaseUrl,
			} as WebviewMessage)
		} else if (apiConfiguration.provider === "lmstudio") {
			vscode.postMessage({
				type: "requestLmStudioModels",
				payload: apiConfiguration?.lmStudioBaseUrl,
			} as WebviewMessage)
		} else if (apiConfiguration.provider === "vscode-lm") {
			vscode.postMessage({ 
				type: "requestVsCodeLmModels",
				payload: undefined
			} as WebviewMessage)
		}
	}, [apiConfiguration.provider, apiConfiguration?.ollamaBaseUrl, apiConfiguration?.lmStudioBaseUrl])

	useEffect(() => {
		if (apiConfiguration.provider === "ollama" || apiConfiguration.provider === "lmstudio" || apiConfiguration.provider === "vscode-lm") {
			requestLocalModels()
		}
	}, [apiConfiguration.provider, requestLocalModels])

	useInterval(
		requestLocalModels,
		apiConfiguration.provider === "ollama" || apiConfiguration.provider === "lmstudio" || apiConfiguration.provider === "vscode-lm" ? 2000 : null,
	)

	const handleMessage = useCallback((event: MessageEvent) => {
		const message: WebviewMessage = event.data
		if (message.type === "ollamaModels" && message.ollamaModels) {
			setOllamaModels(message.ollamaModels)
		} else if (message.type === "lmStudioModels" && message.lmStudioModels) {
			setLmStudioModels(message.lmStudioModels)
		} else if (message.type === "vsCodeLmModels" && message.vsCodeLmModels) {
			setVsCodeLmModels(message.vsCodeLmModels)
		}
	}, [])

	useEvent("message", handleMessage)

	return (
		<div className="api-options">
			<DropdownContainer zIndex={isPopup ? DROPDOWN_Z_INDEX : undefined}>
				<VSCodeDropdown
					value={apiConfiguration.provider}
					onChange={handleInputChange('provider')}
				>
					<VSCodeOption value="openai">OpenAI</VSCodeOption>
					<VSCodeOption value="openrouter">OpenRouter</VSCodeOption>
					<VSCodeOption value="anthropic">Anthropic</VSCodeOption>
					<VSCodeOption value="gemini">Google Gemini</VSCodeOption>
					<VSCodeOption value="mistral">Mistral AI</VSCodeOption>
					<VSCodeOption value="ollama">Ollama</VSCodeOption>
					<VSCodeOption value="lmstudio">LM Studio</VSCodeOption>
					<VSCodeOption value="vscode-lm">VS Code Language Models</VSCodeOption>
				</VSCodeDropdown>
			</DropdownContainer>

			{apiConfiguration.provider === 'openrouter' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={!!apiConfiguration.openRouterModelInfo}
						onChange={handleCheckboxChange('openRouterModelInfo')}
					>
						Use OpenRouter
					</VSCodeCheckbox>
					{apiConfiguration.openRouterModelInfo && (
						<>
							<VSCodeTextField
								value={apiConfiguration.openRouterApiKey || ''}
								onChange={handleInputChange('openRouterApiKey')}
								placeholder="OpenRouter API Key"
							/>
							{showModelOptions && (
								<OpenRouterModelPicker
									modelInfo={apiConfiguration.openRouterModelInfo}
									onChange={handleModelInfoChange}
								/>
							)}
						</>
					)}
				</div>
			)}

			{apiConfiguration.provider === 'openai' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={!!apiConfiguration.openAiModelInfo}
						onChange={handleCheckboxChange('openAiModelInfo')}
					>
						Use OpenAI
					</VSCodeCheckbox>
					{apiConfiguration.openAiModelInfo && (
						<VSCodeTextField
							value={apiConfiguration.openAiApiKey || ''}
							onChange={handleInputChange('openAiApiKey')}
							placeholder="OpenAI API Key"
						/>
					)}
					{showModelOptions && (
						<OpenAiModelPicker
							modelInfo={apiConfiguration.openAiModelInfo}
							onChange={handleModelInfoChange}
						/>
					)}
				</div>
			)}

			{apiConfiguration.provider === 'anthropic' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={!!apiConfiguration.anthropicApiKey}
						onChange={handleCheckboxChange('anthropicApiKey')}
					>
						Use Anthropic
					</VSCodeCheckbox>
					{apiConfiguration.anthropicApiKey && (
						<VSCodeTextField
							value={apiConfiguration.anthropicApiKey}
							onChange={handleInputChange('anthropicApiKey')}
							placeholder="Anthropic API Key"
						/>
					)}
					{showModelOptions && (
						<AnthropicModelPicker
							modelInfo={apiConfiguration.anthropicModelInfo}
							onChange={handleModelInfoChange}
						/>
					)}
				</div>
			)}

			{apiConfiguration.provider === 'gemini' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={!!apiConfiguration.geminiApiKey}
						onChange={handleCheckboxChange('geminiApiKey')}
					>
						Use Google Gemini
					</VSCodeCheckbox>
					{apiConfiguration.geminiApiKey && (
						<VSCodeTextField
							value={apiConfiguration.geminiApiKey}
							onChange={handleInputChange('geminiApiKey')}
							placeholder="Google AI API Key"
						/>
					)}
					{showModelOptions && (
						<GeminiModelPicker
							modelInfo={apiConfiguration.geminiModelInfo}
							onChange={handleModelInfoChange}
						/>
					)}
				</div>
			)}

			{apiConfiguration.provider === 'mistral' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={!!apiConfiguration.mistralApiKey}
						onChange={handleCheckboxChange('mistralApiKey')}
					>
						Use Mistral AI
					</VSCodeCheckbox>
					{apiConfiguration.mistralApiKey && (
						<>
							<VSCodeTextField
								value={apiConfiguration.mistralApiKey}
								onChange={handleInputChange('mistralApiKey')}
								placeholder="Mistral API Key"
							/>
							{showModelOptions && (
								<MistralModelPicker
									modelInfo={apiConfiguration.mistralModelInfo}
									onChange={handleModelInfoChange}
								/>
							)}
						</>
					)}
				</div>
			)}

			{apiConfiguration.provider === 'lmstudio' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={true}
						disabled={true}
					>
						Use LLM Studio (Local)
					</VSCodeCheckbox>
					<>
						<VSCodeTextField
							value={apiConfiguration.lmStudioBaseUrl || 'http://localhost:1234'}
							onChange={handleInputChange('lmStudioBaseUrl')}
							placeholder="LLM Studio URL (default: http://localhost:1234)"
						/>
						{showModelOptions && (
							<LLMStudioModelPicker
								modelInfo={apiConfiguration.lmStudioModelInfo}
								onChange={handleModelInfoChange}
								availableModels={lmStudioModels}
							/>
						)}
					</>
				</div>
			)}

			{apiConfiguration.provider === 'ollama' && (
				<div className="provider-section">
					<VSCodeCheckbox
						checked={true}
						disabled={true}
					>
						Use Ollama (Local)
					</VSCodeCheckbox>
					<>
						<VSCodeTextField
							value={apiConfiguration.ollamaBaseUrl || 'http://localhost:11434'}
							onChange={handleInputChange('ollamaBaseUrl')}
							placeholder="Ollama URL (default: http://localhost:11434)"
						/>
						{showModelOptions && (
							<OllamaModelPicker
								modelInfo={apiConfiguration.ollamaModelInfo}
								onChange={handleModelInfoChange}
								availableModels={ollamaModels}
							/>
						)}
					</>
				</div>
			)}

			{validationErrors.length > 0 && (
				<div className="validation-errors">
					{validationErrors.map((error, index) => (
						<div key={index} className="error-message">{error}</div>
					))}
				</div>
			)}
		</div>
	)
})

export default ApiOptions
