import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeDivider, VSCodeDropdown, VSCodeOption, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import { BenchmarkSessionsList } from './BenchmarkSessionsList';
import { BenchmarkStatsView } from './BenchmarkStatsView';
import { BenchmarkTimelineView } from './BenchmarkTimelineView';
import { SessionDetailView } from './SessionDetailView';
import { useVSCodeApi } from '../../hooks/useVSCodeApi';
import { WebviewMessageType } from '@/shared/WebviewMessageType';
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
];

export const BenchmarkView: React.FC = () => {
  const vscodeApi = useVSCodeApi();
  const [activeTab, setActiveTab] = useState<string>('sessions');
  const [sessions, setSessions] = useState<BenchmarkSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BenchmarkSessionDetail | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<number>(30);
  const [providerStats, setProviderStats] = useState<Record<string, ProviderStats>>({});
  const [timeline, setTimeline] = useState<TimelineStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [providers, setProviders] = useState<string[]>([]);

  // Carica le sessioni all'avvio
  useEffect(() => {
    loadSessions();
    
    // Ascolta i messaggi dall'estensione
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case WebviewMessageType.BENCHMARK_SESSIONS_LOADED:
          setSessions(message.benchmarkSessions || []);
          
          // Estrai l'elenco dei provider da tutte le sessioni
          const providersSet = new Set<string>();
          message.benchmarkSessions?.forEach(session => {
            // Non abbiamo i dettagli del provider qui, li avremo nelle statistiche
            providersSet.add('all');
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
          
          // Aggiorna l'elenco dei provider
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
          // Ricarica l'elenco delle sessioni
          loadSessions();
          // Se la sessione eliminata era quella selezionata, deselezionala
          if (selectedSession && selectedSession.id === message.benchmarkSessionId) {
            setSelectedSession(null);
          }
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscodeApi]);

  // Carica le sessioni
  const loadSessions = () => {
    setLoading(true);
    vscodeApi.postMessage({
      type: WebviewMessageType.GET_BENCHMARK_SESSIONS
    });
  };

  // Carica le statistiche
  const loadStats = () => {
    setLoading(true);
    vscodeApi.postMessage({
      type: WebviewMessageType.GET_BENCHMARK_STATS,
      benchmarkTimeframe: timeframe
    });
  };

  // Carica la timeline
  const loadTimeline = (provider: string) => {
    if (provider === 'all') return;
    
    setLoading(true);
    vscodeApi.postMessage({
      type: WebviewMessageType.GET_BENCHMARK_TIMELINE,
      benchmarkProvider: provider,
      benchmarkTimeframe: timeframe
    });
  };

  // Carica i dettagli di una sessione
  const loadSessionDetails = (sessionId: string) => {
    setLoading(true);
    vscodeApi.postMessage({
      type: WebviewMessageType.GET_BENCHMARK_SESSION,
      benchmarkSessionId: sessionId
    });
  };

  // Esporta una sessione
  const exportSession = (sessionId: string) => {
    vscodeApi.postMessage({
      type: WebviewMessageType.EXPORT_BENCHMARK_SESSION,
      benchmarkSessionId: sessionId
    });
  };

  // Elimina una sessione
  const deleteSession = (sessionId: string) => {
    vscodeApi.postMessage({
      type: WebviewMessageType.DELETE_BENCHMARK_SESSION,
      benchmarkSessionId: sessionId
    });
  };

  // Gestisce il cambio di provider
  const handleProviderChange = (e: React.FormEvent<HTMLSelectElement>) => {
    const provider = e.currentTarget.value;
    setSelectedProvider(provider);
    
    if (provider !== 'all') {
      loadTimeline(provider);
    }
  };

  // Gestisce il cambio di timeframe
  const handleTimeframeChange = (e: React.FormEvent<HTMLSelectElement>) => {
    const tf = parseInt(e.currentTarget.value, 10);
    setTimeframe(tf);
    
    // Ricarica statistiche e timeline
    setTimeout(() => {
      loadStats();
      if (selectedProvider !== 'all') {
        loadTimeline(selectedProvider);
      }
    }, 0);
  };

  // Gestisce il cambio di tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === 'stats' && Object.keys(providerStats).length === 0) {
      loadStats();
    } else if (tab === 'timeline' && timeline.length === 0 && selectedProvider !== 'all') {
      loadTimeline(selectedProvider);
    }
  };

  // Gestisce la selezione di una sessione
  const handleSessionSelect = (sessionId: string) => {
    loadSessionDetails(sessionId);
  };

  // Gestisce il ritorno alla lista delle sessioni
  const handleBackToList = () => {
    setSelectedSession(null);
  };

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
        <VSCodePanels activeId={activeTab} onTabSelect={e => handleTabChange(e.detail.tab.id)}>
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
            {loading && Object.keys(providerStats).length === 0 ? (
              <EmptyState>Caricamento statistiche in corso...</EmptyState>
            ) : Object.keys(providerStats).length === 0 ? (
              <EmptyState>
                <p>Nessuna statistica di benchmark disponibile.</p>
                <p>Esegui alcuni test ed importali per visualizzare le statistiche.</p>
              </EmptyState>
            ) : (
              <BenchmarkStatsView 
                stats={providerStats} 
                selectedProvider={selectedProvider}
                timeframe={timeframe}
                onLoadTimeline={(provider) => {
                  setSelectedProvider(provider);
                  loadTimeline(provider);
                  handleTabChange('timeline');
                }}
              />
            )}
          </VSCodePanelView>
          
          <VSCodePanelView id="timeline">
            {selectedProvider === 'all' ? (
              <EmptyState>
                <p>Seleziona un provider specifico per visualizzare la timeline.</p>
              </EmptyState>
            ) : loading && timeline.length === 0 ? (
              <EmptyState>Caricamento timeline in corso...</EmptyState>
            ) : timeline.length === 0 ? (
              <EmptyState>
                <p>Nessun dato timeline disponibile per il provider selezionato.</p>
              </EmptyState>
            ) : (
              <BenchmarkTimelineView 
                timeline={timeline} 
                provider={selectedProvider}
                timeframe={timeframe}
              />
            )}
          </VSCodePanelView>
        </VSCodePanels>
      </ContentContainer>
    </Container>
  );
}; 