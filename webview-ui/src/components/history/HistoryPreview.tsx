import React, { useCallback } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { ChatHistoryItem } from '../../types/extension';
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { memo } from "react"
import { formatLargeNumber } from "../../utils/format"

interface HistoryPreviewProps {
	items: ChatHistoryItem[];
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
}

export const HistoryPreview: React.FC<HistoryPreviewProps> = ({
	items,
	onSelect,
	onDelete
}) => {
	const { taskHistory } = useExtensionState()

	const handleHistorySelect = useCallback((id: string) => {
		onSelect(id);
	}, [onSelect]);

	const handleDelete = useCallback((id: string) => {
		onDelete(id);
	}, [onDelete]);

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp)
		return date
			?.toLocaleString("en-US", {
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			})
			.replace(", ", " ")
			.replace(" at", ",")
			.toUpperCase()
	}

	return (
		<div className="history-preview">
			<div style={{ flexShrink: 0 }}>
				<style>
					{`
						.history-preview {
							display: flex;
							flex-direction: column;
							height: 100%;
							overflow: hidden;
						}
						.history-preview-item {
							cursor: pointer;
							border-bottom: 1px solid var(--vscode-panel-border);
						}
						.history-preview-item:hover {
							background-color: var(--vscode-list-hoverBackground);
						}
						.history-preview-item.selected {
							background-color: var(--vscode-list-activeSelectionBackground);
						}
						.history-preview-item-title {
							font-weight: bold;
							margin-bottom: 4px;
						}
						.history-preview-item-date {
							color: var(--vscode-descriptionForeground);
							font-size: 0.9em;
						}
						.history-preview-item-stats {
							display: flex;
							gap: 8px;
							color: var(--vscode-descriptionForeground);
							font-size: 0.9em;
						}
					`}
				</style>
			</div>
			<div className="history-preview-list">
				{items.map((item) => (
					<div
						key={item.id}
						className="history-preview-item"
						onClick={() => handleHistorySelect(item.id)}
					>
						<div style={{ padding: "12px" }}>
							<div style={{ marginBottom: "8px" }}>
								<span className="history-preview-item-title">
									{item.title || 'Chat senza titolo'}
								</span>
							</div>
							<div className="history-preview-item-date">
								{new Date(item.timestamp).toLocaleString()}
							</div>
							<div className="history-preview-item-stats">
								<span>
									Messaggi: {item.messages.length}
								</span>
								{item.totalCost !== undefined && (
									<>
										<span>
											Costo API: ${item.totalCost.toFixed(4)}
										</span>
									</>
								)}
								{item.totalTokens !== undefined && (
									<>
										<span>
											Token: {item.totalTokens}
										</span>
									</>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
			<div className="history-preview-actions">
				<VSCodeButton
					onClick={() => handleDelete(items[0]?.id)}
					disabled={items.length === 0}
				>
					Elimina
				</VSCodeButton>
			</div>
		</div>
	);
};

export default memo(HistoryPreview)
