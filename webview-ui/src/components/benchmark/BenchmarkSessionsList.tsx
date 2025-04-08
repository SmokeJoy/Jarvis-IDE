import React from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from '@vscode/webview-ui-toolkit/react';
import { BenchmarkSession } from '@/shared/WebviewMessage';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  overflow: auto;
`;

const GridContainer = styled.div`
  height: 100%;
  overflow: auto;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

interface BenchmarkSessionsListProps {
  sessions: BenchmarkSession[];
  onSessionSelect: (sessionId: string) => void;
  onExport: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export const BenchmarkSessionsList: React.FC<BenchmarkSessionsListProps> = ({
  sessions,
  onSessionSelect,
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
      minute: '2-digit'
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

  return (
    <Container>
      <GridContainer>
        <VSCodeDataGrid generateHeader="sticky" gridTemplateColumns="1fr 1fr 1fr 1fr auto">
          <VSCodeDataGridRow rowType="header">
            <VSCodeDataGridCell cellType="columnheader" gridColumn="1">Data</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="2">Provider</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="3">Test</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="4">Durata</VSCodeDataGridCell>
            <VSCodeDataGridCell cellType="columnheader" gridColumn="5">Azioni</VSCodeDataGridCell>
          </VSCodeDataGridRow>

          {sessions.map(session => (
            <VSCodeDataGridRow key={session.id}>
              <VSCodeDataGridCell gridColumn="1">{formatDate(session.timestamp)}</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="2">{session.provider}</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="3">{session.testCount} test</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="4">{formatDuration(session.duration)}</VSCodeDataGridCell>
              <VSCodeDataGridCell gridColumn="5">
                <ButtonsContainer>
                  <VSCodeButton appearance="secondary" onClick={() => onSessionSelect(session.id)}>
                    Dettagli
                  </VSCodeButton>
                  <VSCodeButton appearance="secondary" onClick={() => onExport(session.id)}>
                    Esporta
                  </VSCodeButton>
                  <VSCodeButton appearance="secondary" onClick={() => onDelete(session.id)}>
                    Elimina
                  </VSCodeButton>
                </ButtonsContainer>
              </VSCodeDataGridCell>
            </VSCodeDataGridRow>
          ))}
        </VSCodeDataGrid>
      </GridContainer>
    </Container>
  );
}; 