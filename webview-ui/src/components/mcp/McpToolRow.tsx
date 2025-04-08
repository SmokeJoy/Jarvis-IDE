import React, { useCallback } from 'react';
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import { McpTool } from "../../types/extension"
import { vscode } from "../../utilities/vscode"
import { useExtensionState } from "../../context/ExtensionStateContext"

interface McpToolRowProps {
	toolName: string;
	isAutoApprove: boolean;
	onAutoApproveChange: (isAutoApprove: boolean) => void;
}

export const McpToolRow: React.FC<McpToolRowProps> = ({
	toolName,
	isAutoApprove,
	onAutoApproveChange
}) => {
	const { autoApprovalSettings } = useExtensionState()

	const handleAutoApproveChange = useCallback((event: React.FormEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement;
		onAutoApproveChange(target.checked);
		vscode.postMessage({
			type: 'setAutoApprove',
			toolName,
			isAutoApproved: target.checked
		});
	}, [toolName, onAutoApproveChange]);

	return (
		<div className="tool-row" key={toolName}>
			<div
				className="tool-header"
				data-testid="tool-row-container"
				onClick={(event: React.MouseEvent) => event.stopPropagation()}>
				<div className="tool-title">
					<span className="codicon codicon-symbol-method" />
					<span className="tool-name">{toolName}</span>
				</div>
				{autoApprovalSettings.enabled && autoApprovalSettings.actions.useMcp && (
					<VSCodeCheckbox
						checked={isAutoApprove}
						onChange={handleAutoApproveChange}
						data-tool={toolName}>
						Auto-approve
					</VSCodeCheckbox>
				)}
			</div>
			{toolName && (
				<div className="tool-description">
					{toolName}
				</div>
			)}
			{toolName &&
				"properties" in autoApprovalSettings.inputSchema &&
				Object.keys(autoApprovalSettings.inputSchema.properties as Record<string, any>).length > 0 && (
					<div className="tool-parameters">
						<div className="parameters-header">Parameters</div>
						{Object.entries(autoApprovalSettings.inputSchema.properties as Record<string, any>).map(([paramName, schema]) => {
							const isRequired =
								autoApprovalSettings.inputSchema &&
								"required" in autoApprovalSettings.inputSchema &&
								Array.isArray(autoApprovalSettings.inputSchema.required) &&
								autoApprovalSettings.inputSchema.required.includes(paramName)

							return (
								<div key={paramName} className="parameter-row">
									<code className="parameter-name">
										{paramName}
										{isRequired && <span className="required-indicator">*</span>}
									</code>
									<span className="parameter-description">
										{schema.description || "No description"}
									</span>
								</div>
							)
						})}
					</div>
				)}
		</div>
	)
}

export default McpToolRow
