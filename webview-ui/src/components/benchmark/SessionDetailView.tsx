import React from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { BenchmarkSessionDetail, BenchmarkResult } from '@/shared/WebviewMessage';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  overflow: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const BackButton = styled(VSCodeButton)`
  margin-right: 1rem;
`;

const Title = styled.h3`
  margin: 0;
  flex-grow: 1;
`;

const ButtonsGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const InfoContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  background-color: var(--vscode-editor-background);
  padding: 1rem;
  border-radius: 4px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: var(--vscode-descriptionForeground);
`;

const InfoValue = styled.span`
  font-size: 1rem;
  font-weight: 500;
`;

const GridContainer = styled.div`
  margin-top: 1rem;
  height: calc(100% - 200px);
  overflow: auto;
`;

interface SessionDetailViewProps {
  session: BenchmarkSessionDetail;
  onBack: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  session,
  onBack,
  onExport,
  onDelete
}) => {
  // Formatta la data
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Formatta la durata
  const formatDuration = (durationMs: number): string => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Formatta il tempo di risposta
  const formatResponseTime = (responseTimeMs: number): string => {
    if (responseTimeMs < 1000) {
      return `${responseTimeMs.toFixed(0)}ms`;
    }
    return `${(responseTimeMs / 1000).toFixed(2)}s`;
  };

  return (
    <Container>
      <Header>
        <BackButton appearance="secondary" onClick={onBack}>
          ← Indietro
        </BackButton>
        <Title>Dettagli sessione: {session.provider}</Title>
        <ButtonsGroup>
          <VSCodeButton appearance="secondary" onClick={onExport}>
            Esporta
          </VSCodeButton>
          <VSCodeButton appearance="secondary" onClick={onDelete}>
            Elimina
          </VSCodeButton>
        </ButtonsGroup>
      </Header>

      <InfoContainer>
        <InfoItem>
          <InfoLabel>Provider</InfoLabel>
          <InfoValue>{session.provider}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Data</InfoLabel>
          <InfoValue>{formatDate(session.timestamp)}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Durata totale</InfoLabel>
          <InfoValue>{formatDuration(session.duration)}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Test completati</InfoLabel>
          <InfoValue>{session.results.length}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Tempo medio</InfoLabel>
          <InfoValue>
            {formatResponseTime(
              session.results.reduce((sum, result) => sum + result.responseTime, 0) / session.results.length
            )}
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Messaggi</InfoLabel>
          <InfoValue>
            {session.results.reduce((sum, result) => sum + result.tokens.inputTokens, 0)} in / {' '}
            {session.results.reduce((sum, result) => sum + result.tokens.outputTokens, 0)} out
          </InfoValue>
        </InfoItem>
      </InfoContainer>

      <VSCodeDivider />

      <GridContainer>
        <VSCodeDataGrid generateHeader="sticky" gridTemplateColumns="1fr 1fr 1fr 1fr">
          <VSCodeDataGridRow rowType="header">
            <VSCodeDataGridCell cellType="columnheader" gridColumn="1">Caso di test</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="2">Modello</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="3">Tempo di risposta</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="4">Token in/out</VSCodeDataGridCell>
          </VSCodeDataGridRow>

          {session.results.map((result: BenchmarkResult, index: number) => (
            <VSCodeDataGridRow key={index}>
              <VSCodeDataGridCell gridColumn="1">{result.testName}</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="2">{result.model}</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="3">{formatResponseTime(result.responseTime)}</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="4">
                {result.tokens.inputTokens} / {result.tokens.outputTokens}
              </VSCodeDataGridCell>
            </VSCodeDataGridRow>
          ))}
        </VSCodeDataGrid>
      </GridContainer>
    </Container>
  );
}; 