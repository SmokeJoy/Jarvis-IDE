import React from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { ProviderStats } from '@/shared/WebviewMessage';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  overflow: auto;
`;

const Header = styled.h3`
  margin: 0 0 1rem 0;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const ProviderName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--vscode-foreground);
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.span`
  color: var(--vscode-descriptionForeground);
  font-size: 0.9rem;
`;

const StatValue = styled.span`
  font-weight: 500;
  font-size: 0.9rem;
`;

const PerformanceBar = styled.div<{ width: number, color: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: ${props => props.width}%;
  background-color: ${props => props.color};
  transition: width 0.3s ease-in-out;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

interface BenchmarkStatsViewProps {
  stats: Record<string, ProviderStats>;
  selectedProvider: string;
  timeframe: number;
  onLoadTimeline: (provider: string) => void;
}

export const BenchmarkStatsView: React.FC<BenchmarkStatsViewProps> = ({
  stats,
  selectedProvider,
  timeframe,
  onLoadTimeline
}) => {
  // Formatta il tempo di risposta
  const formatResponseTime = (responseTimeMs: number): string => {
    if (responseTimeMs < 1000) {
      return `${responseTimeMs.toFixed(0)}ms`;
    }
    return `${(responseTimeMs / 1000).toFixed(2)}s`;
  };

  // Calcola la larghezza percentuale della barra in base alla velocità relativa
  const calculateBarWidth = (avgResponseTime: number): number => {
    const allResponseTimes = Object.values(stats).map(stat => stat.avgResponseTime);
    const minResponseTime = Math.min(...allResponseTimes);
    const maxResponseTime = Math.max(...allResponseTimes);
    
    // Se tutti i tempi sono uguali, restituisci 100%
    if (minResponseTime === maxResponseTime) return 100;
    
    // Calcola la percentuale inversa (più veloce = barra più lunga)
    const normalized = (maxResponseTime - avgResponseTime) / (maxResponseTime - minResponseTime);
    return normalized * 100;
  };

  // Determina il colore della barra in base alla velocità relativa
  const getBarColor = (avgResponseTime: number): string => {
    const allResponseTimes = Object.values(stats).map(stat => stat.avgResponseTime);
    const minResponseTime = Math.min(...allResponseTimes);
    const maxResponseTime = Math.max(...allResponseTimes);
    
    // Calcola la percentuale di velocità (più veloce = percentuale più alta)
    const normalized = (maxResponseTime - avgResponseTime) / (maxResponseTime - minResponseTime);
    
    if (normalized > 0.8) return 'var(--vscode-testing-iconPassed)'; // Verde
    if (normalized > 0.4) return 'var(--vscode-charts-yellow)';     // Giallo
    return 'var(--vscode-charts-red)';                              // Rosso
  };

  return (
    <Container>
      <Header>Statistiche (ultimi {timeframe} giorni)</Header>
      
      <StatsContainer>
        {Object.entries(stats).map(([provider, providerStat]) => (
          <StatCard key={provider}>
            <ProviderName>{provider}</ProviderName>
            
            <StatItem>
              <StatLabel>Tempo medio</StatLabel>
              <StatValue>{formatResponseTime(providerStat.avgResponseTime)}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Tempo più veloce</StatLabel>
              <StatValue>{formatResponseTime(providerStat.fastestResponseTime)}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Tempo più lento</StatLabel>
              <StatValue>{formatResponseTime(providerStat.slowestResponseTime)}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Token input med.</StatLabel>
              <StatValue>{Math.round(providerStat.avgInputTokens)}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Token output med.</StatLabel>
              <StatValue>{Math.round(providerStat.avgOutputTokens)}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Sessioni</StatLabel>
              <StatValue>{providerStat.sessionCount}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Test</StatLabel>
              <StatValue>{providerStat.testCount}</StatValue>
            </StatItem>
            
            <ButtonsContainer>
              <VSCodeButton appearance="secondary" onClick={() => onLoadTimeline(provider)}>
                Timeline
              </VSCodeButton>
            </ButtonsContainer>
            
            <PerformanceBar 
              width={calculateBarWidth(providerStat.avgResponseTime)} 
              color={getBarColor(providerStat.avgResponseTime)} 
            />
          </StatCard>
        ))}
      </StatsContainer>
      
      <VSCodeDivider />
      
      <div style={{ marginTop: '1rem' }}>
        <p>
          Nota: La barra colorata sotto ogni provider rappresenta la velocità relativa. 
          Verde indica un provider più veloce, rosso indica uno più lento.
        </p>
      </div>
    </Container>
  );
}; 