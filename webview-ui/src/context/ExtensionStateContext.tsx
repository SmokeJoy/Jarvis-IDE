import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useEvent } from "react-use"
import { DEFAULT_AUTO_APPROVAL_SETTINGS } from "@/shared/AutoApprovalSettings"
import { ExtensionMessage } from "@/shared/ExtensionMessage"
import { ApiConfiguration, OpenAiCompatibleModelInfo } from "@/shared/types/api.types"
import { findLastIndex } from "@/shared/array"
import { McpMarketplaceCatalog, McpServer } from "@/shared/mcp"
import { convertTextMateToHljs } from "@/utils/textMateToHljs"
import { vscode } from "@/utils/vscode"
import { DEFAULT_BROWSER_SETTINGS } from "@/shared/BrowserSettings"
import { DEFAULT_CHAT_SETTINGS } from "@/shared/ChatSettings"
import { TelemetrySetting } from "@/shared/TelemetrySetting"
import { ExtensionState } from "@/types/extension"
import { ConfigModelInfo } from "@/types/models"

interface ExtensionStateContextType {
	state: ExtensionState
	setApiConfiguration: (config: ApiConfiguration) => void
	setTelemetrySetting: (setting: TelemetrySetting) => void
	setCustomInstructions: (instructions: string) => void
	setShowWelcome: (show: boolean) => void
	setPlanActSeparateModelsSetting: (setting: boolean) => void
	setAvailableModels: (models: ConfigModelInfo[]) => void
	setSelectedModel: (modelId: string) => void
}

const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined)

export const ExtensionStateProvider: React.FC<{
	children: React.ReactNode
}> = ({ children }) => {
	const [state, setState] = useState<ExtensionState>({
		didHydrateState: false,
		showWelcome: true,
		shouldShowAnnouncement: true,
		telemetrySetting: { enabled: false },
		version: '1.0.0',
		customInstructions: '',
		chatSettings: {
			autoApprove: false,
			setAutoApprove: () => {},
			mode: 'chat'
		},
		apiConfiguration: {
			provider: 'openai'
		},
		availableModels: [],
		selectedModel: '',
		openAiModels: [],
		openRouterModels: [],
		vscMachineId: '',
		planActSeparateModelsSetting: false,
		theme: 'light',
		taskHistory: [],
		totalTasksSize: 0,
		mcpServers: [],
		mcpMarketplaceEnabled: false,
		mcpMarketplaceCatalog: [],
		autoApprovalSettings: DEFAULT_AUTO_APPROVAL_SETTINGS,
		uriScheme: '',
		jarvisIdeMessages: [],
		currentTaskItem: null,
		checkpointTrackerErrorMessage: null,
		browserSettings: DEFAULT_BROWSER_SETTINGS,
		filePaths: [],
		platform: 'unknown',
		chatHistory: []
	})

	const setApiConfiguration = useCallback((config: ApiConfiguration) => {
		setState(prev => ({ ...prev, apiConfiguration: config }))
	}, [])

	const setTelemetrySetting = useCallback((setting: TelemetrySetting) => {
		setState(prev => ({ ...prev, telemetrySetting: setting }))
	}, [])

	const setCustomInstructions = useCallback((instructions: string) => {
		setState(prev => ({ ...prev, customInstructions: instructions }))
	}, [])

	const setShowWelcome = useCallback((show: boolean) => {
		setState(prev => ({ ...prev, showWelcome: show }))
	}, [])

	const setPlanActSeparateModelsSetting = useCallback((setting: boolean) => {
		setState(prev => ({ ...prev, planActSeparateModelsSetting: setting }))
	}, [])

	const setAvailableModels = useCallback((models: ConfigModelInfo[]) => {
		setState(prev => ({ ...prev, availableModels: models }))
	}, [])

	const setSelectedModel = useCallback((modelId: string) => {
		setState(prev => ({ ...prev, selectedModel: modelId }))
	}, [])

	return (
		<ExtensionStateContext.Provider
			value={{
				state,
				setApiConfiguration,
				setTelemetrySetting,
				setCustomInstructions,
				setShowWelcome,
				setPlanActSeparateModelsSetting,
				setAvailableModels,
				setSelectedModel
			}}
		>
			{children}
		</ExtensionStateContext.Provider>
	)
}

export const useExtensionState = () => {
	const context = useContext(ExtensionStateContext)
	if (context === undefined) {
		throw new Error("useExtensionState must be used within an ExtensionStateProvider")
	}
	return context
}
