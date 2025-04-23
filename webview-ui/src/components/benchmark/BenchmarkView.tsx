import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeDivider, VSCodeDropdown, VSCodeOption, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import { BenchmarkSessionsList } from './BenchmarkSessionsList';
import { BenchmarkStatsView } from './BenchmarkStatsView';
import { BenchmarkTimelineView } from './BenchmarkTimelineView';
import { SessionDetailView } from './SessionDetailView';
import { useVSCodeApi } from '../../hooks/useVSCodeApi';
import { WebviewMessageType } from '@shared/types/webview.types';
import { BenchmarkSession, BenchmarkSessionDetail, ProviderStats, TimelineStats } from '@/shared/WebviewMessage';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 1rem;
  color: var(--vscode-foreground);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--vscode-foreground);
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const DropdownContainer = styled.div`
  min-width: 200px;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: auto;
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: var(--vscode-descriptionForeground);
`;

const timeframeOptions = [
  { label: 'Ultimi 7 giorni', value: 7 },
  { label: 'Ultimi 30 giorni', value: 30 },
  { label: 'Ultimi 90 giorni', value: 90 },
  { label: 'Ultimo anno', value: 365 },
] as const;

export const BenchmarkView: React.FC = () => {
  const vscode = useVSCodeApi();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<BenchmarkSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BenchmarkSessionDetail | null>(null);
  const [providers, setProviders] = useState<string[]>(['all']);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<string>('sessions');
  const [providerStats, setProviderStats] = useState<Record<string, ProviderStats>>({});
  const [timeline, setTimeline] = useState<TimelineStats[]>([]);

  // Load initial data
  useEffect(() => {
    loadSessions();
    loadStats();
    loadTimeline();
  }, [selectedProvider, timeframe]);

  const loadSessions = () => {
    setLoading(true);
    vscode.postMessage({
      type: WebviewMessageType.LOAD_BENCHMARK_SESSIONS,
      provider: selectedProvider,
      timeframe
    });
  };

  const loadStats = () => {
    setLoading(true);
    vscode.postMessage({
      type: WebviewMessageType.LOAD_BENCHMARK_STATS,
      provider: selectedProvider,
      timeframe
    });
  };

  const loadTimeline = () => {
    setLoading(true);
    vscode.postMessage({
      type: WebviewMessageType.LOAD_BENCHMARK_TIMELINE,
      provider: selectedProvider,
      timeframe
    });
  };

  const handleSessionSelect = (sessionId: string) => {
    setLoading(true);
    vscode.postMessage({
      type: WebviewMessageType.LOAD_BENCHMARK_SESSION,
      benchmarkSessionId: sessionId
    });
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  const exportSession = (sessionId: string) => {
    vscode.postMessage({
      type: WebviewMessageType.EXPORT_BENCHMARK_SESSION,
      benchmarkSessionId: sessionId
    });
  };

  const deleteSession = (sessionId: string) => {
    vscode.postMessage({
      type: WebviewMessageType.DELETE_BENCHMARK_SESSION,
      benchmarkSessionId: sessionId
    });
  };

  const handleProviderChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setSelectedProvider(target.value);
  };

  const handleTimeframeChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setTimeframe(parseInt(target.value, 10));
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case WebviewMessageType.BENCHMARK_SESSIONS_LOADED:
          setSessions(message.benchmarkSessions || []);
          const providersSet = new Set<string>();
          message.benchmarkSessions?.forEach((session: BenchmarkSession) => {
            providersSet.add(session.provider);
          });
          setProviders(['all', ...Array.from(providersSet)]);
          setLoading(false);
          break;
          
        case WebviewMessageType.BENCHMARK_SESSION_LOADED:
          setSelectedSession(message.benchmarkSession || null);
          setLoading(false);
          break;
          
        case WebviewMessageType.BENCHMARK_STATS_LOADED:
          setProviderStats(message.benchmarkStats || {});
          if (message.benchmarkStats) {
            const statsProviders = Object.keys(message.benchmarkStats);
            setProviders(['all', ...statsProviders]);
          }
          setLoading(false);
          break;
          
        case WebviewMessageType.BENCHMARK_TIMELINE_LOADED:
          setTimeline(message.benchmarkTimeline || []);
          setLoading(false);
          break;
          
        case WebviewMessageType.BENCHMARK_SESSION_DELETED:
          loadSessions();
          if (selectedSession && selectedSession.id === message.benchmarkSessionId) {
            setSelectedSession(null);
          }
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedSession]);

  return (
    <Container>
      <Header>
        <Title>Benchmark LLM</Title>
        <ControlsContainer>
          <DropdownContainer>
            <VSCodeDropdown onChange={handleProviderChange} value={selectedProvider}>
              <VSCodeOption value="all">Tutti i provider</VSCodeOption>
              {providers.filter(p => p !== 'all').map(provider => (
                <VSCodeOption key={provider} value={provider}>
                  {provider}
                </VSCodeOption>
              ))}
            </VSCodeDropdown>
          </DropdownContainer>
          
          <DropdownContainer>
            <VSCodeDropdown onChange={handleTimeframeChange} value={timeframe.toString()}>
              {timeframeOptions.map(option => (
                <VSCodeOption key={option.value} value={option.value.toString()}>
                  {option.label}
                </VSCodeOption>
              ))}
            </VSCodeDropdown>
          </DropdownContainer>
          
          <VSCodeButton onClick={loadSessions}>Aggiorna</VSCodeButton>
        </ControlsContainer>
      </Header>
      
      <VSCodeDivider />
      
      <ContentContainer>
        <VSCodePanels activeid={activeTab} onTabSelect={(e: CustomEvent) => handleTabChange(e.detail.tab.id)}>
          <VSCodePanelTab id="sessions">Sessioni</VSCodePanelTab>
          <VSCodePanelTab id="stats">Statistiche</VSCodePanelTab>
          <VSCodePanelTab id="timeline">Timeline</VSCodePanelTab>
          
          <VSCodePanelView id="sessions">
            {loading && sessions.length === 0 ? (
              <EmptyState>Caricamento sessioni in corso...</EmptyState>
            ) : sessions.length === 0 ? (
              <EmptyState>
                <p>Nessuna sessione di benchmark trovata.</p>
                <p>Esegui alcuni test con il comando:</p>
                <code>npm run test:providers -- --export-json</code>
                <p>e poi importali con:</p>
                <code>npm run benchmark:import</code>
              </EmptyState>
            ) : selectedSession ? (
              <SessionDetailView 
                session={selectedSession} 
                onBack={handleBackToList}
                onExport={() => exportSession(selectedSession.id)}
                onDelete={() => deleteSession(selectedSession.id)}
              />
            ) : (
              <BenchmarkSessionsList 
                sessions={sessions} 
                onSessionSelect={handleSessionSelect}
                onExport={exportSession}
                onDelete={deleteSession}
              />
            )}
          </VSCodePanelView>
          
          <VSCodePanelView id="stats">
            <BenchmarkStatsView stats={providerStats} provider={selectedProvider} timeframe={timeframe} />
          </VSCodePanelView>
          
          <VSCodePanelView id="timeline">
            <BenchmarkTimelineView timeline={timeline} provider={selectedProvider} timeframe={timeframe} />
          </VSCodePanelView>
        </VSCodePanels>
      </ContentContainer>
    </Container>
  );
}; 