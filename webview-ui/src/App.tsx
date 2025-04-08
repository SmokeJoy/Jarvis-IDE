import React, { useEffect, useState } from "react";
import { VSCodeButton, VSCodePanelTab, VSCodePanelView, VSCodePanels, VSCodeDivider } from "@vscode/webview-ui-toolkit/react";
import { WebviewMessageType } from "@/shared/WebviewMessageType";
import styled from 'styled-components';
import { useVSCodeApi } from "./hooks/useVSCodeApi";
import { ChatView } from "./components/ChatView";
import { ChatHistoryView } from "./components/ChatHistoryView";
import { LogViewer } from "./components/LogViewer";
import { SettingsPanel } from "./components/SettingsPanel";
import { SystemPromptEditor } from "./components/SystemPromptEditor";
import { BenchmarkView } from "./components/benchmark/BenchmarkView";
import { MasControlPanel } from './components/MasControlPanel';

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
`;

const TabsContainer = styled.div`
	flex-shrink: 0;
`;

const ContentContainer = styled.div`
	flex-grow: 1;
	overflow: hidden;
`;

export function App() {
	const vscodeApi = useVSCodeApi();
	const [activeTab, setActiveTab] = useState<string>("chat");

	// Gestisce il cambio di tab
	const handleTabSelect = (event: CustomEvent) => {
		setActiveTab(event.detail.tab.id);
	};

	// Inizializza lo stato
	useEffect(() => {
		vscodeApi.postMessage({
			type: WebviewMessageType.GET_STATE,
		});
	}, [vscodeApi]);

	return (
		<AppContainer>
			<TabsContainer>
				<VSCodePanels onTabSelect={handleTabSelect} activeid={activeTab}>
					<VSCodePanelTab id="chat">Chat</VSCodePanelTab>
					<VSCodePanelTab id="history">Cronologia</VSCodePanelTab>
					<VSCodePanelTab id="logs">Log</VSCodePanelTab>
					<VSCodePanelTab id="settings">Impostazioni</VSCodePanelTab>
					<VSCodePanelTab id="system-prompt">Prompt di Sistema</VSCodePanelTab>
					<VSCodePanelTab id="benchmark">Benchmark</VSCodePanelTab>
					<VSCodePanelTab id="mas">Sistema Multi-Agent</VSCodePanelTab>
					<VSCodeDivider />
				</VSCodePanels>
			</TabsContainer>

			<ContentContainer>
				<VSCodePanels activeid={activeTab}>
					<VSCodePanelView id="chat">
						<ChatView />
					</VSCodePanelView>
					
					<VSCodePanelView id="history">
						<ChatHistoryView />
					</VSCodePanelView>
					
					<VSCodePanelView id="logs">
						<LogViewer />
					</VSCodePanelView>
					
					<VSCodePanelView id="settings">
						<SettingsPanel />
					</VSCodePanelView>
					
					<VSCodePanelView id="system-prompt">
						<SystemPromptEditor />
					</VSCodePanelView>
					
					<VSCodePanelView id="benchmark">
						<BenchmarkView />
					</VSCodePanelView>
					
					<VSCodePanelView id="mas">
						<MasControlPanel />
					</VSCodePanelView>
				</VSCodePanels>
			</ContentContainer>
		</AppContainer>
	);
}
