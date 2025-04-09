import React, { useMemo } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { ApiConfiguration } from "../../types/extension"

interface TaskHeaderProps {
	task: any
	tokensIn: number
	tokensOut: number
	cacheWrites?: number
	cacheReads?: number
	totalCost: number
	lastApiReqTotalTokens?: number
	onClose: () => void
	apiConfiguration: ApiConfiguration
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
	task,
	tokensIn,
	tokensOut,
	cacheWrites,
	cacheReads,
	totalCost,
	lastApiReqTotalTokens,
	onClose,
	apiConfiguration,
}) => {
	const doesModelSupportPromptCache = useMemo(() => {
		return (
			apiConfiguration?.provider === "openai" &&
			apiConfiguration?.openAiModelInfo?.name?.startsWith("gpt-3.5")
		)
	}, [apiConfiguration?.provider, apiConfiguration?.openAiModelInfo])

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
				<div>Tokens In: {tokensIn}</div>
				<div>Tokens Out: {tokensOut}</div>
				{lastApiReqTotalTokens && <div>Last API Request Total Tokens: {lastApiReqTotalTokens}</div>}
				{cacheWrites !== undefined && <div>Cache Writes: {cacheWrites}</div>}
				{cacheReads !== undefined && <div>Cache Reads: {cacheReads}</div>}
				<div>Total Cost: ${totalCost.toFixed(4)}</div>
				<VSCodeButton appearance="secondary" onClick={onClose}>
					Close
				</VSCodeButton>
			</div>
		</div>
	)
}
