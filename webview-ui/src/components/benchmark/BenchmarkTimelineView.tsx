import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { TimelineStats } from '@/shared/WebviewMessage';

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

const Title = styled.h3`
  margin: 0;
`;

const ChartContainer = styled.div`
  height: 400px;
  margin-bottom: 2rem;
  position: relative;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const StatCard = styled.div`
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 1rem;
`;

const StatTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
`;

interface BenchmarkTimelineViewProps {
  timeline: TimelineStats[];
  provider: string;
  timeframe: number;
}

export const BenchmarkTimelineView: React.FC<BenchmarkTimelineViewProps> = ({ 
  timeline, 
  provider,
  timeframe
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Formatta il tempo di risposta
  const formatResponseTime = (responseTimeMs: number): string => {
    if (responseTimeMs < 1000) {
      return `${responseTimeMs.toFixed(0)}ms`;
    }
    return `${(responseTimeMs / 1000).toFixed(2)}s`;
  };

  // Ordina la timeline per data
  const sortedTimeline = [...timeline].sort((a, b) => a.date - b.date);
  
  // Calcola statistiche generali
  const avgResponseTime = sortedTimeline.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / sortedTimeline.length;
  const minResponseTime = Math.min(...sortedTimeline.map(stat => stat.avgResponseTime));
  const maxResponseTime = Math.max(...sortedTimeline.map(stat => stat.avgResponseTime));
  
  // Funzione per disegnare il grafico
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Imposta la dimensione del canvas per evitare blur
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Definisci i margini
    const margin = {
      top: 20,
      right: 20,
      bottom: 50,
      left: 60
    };
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, width, height);
    
    // Se non ci sono dati, mostra un messaggio
    if (sortedTimeline.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'var(--vscode-foreground)';
      ctx.textAlign = 'center';
      ctx.fillText('Nessun dato disponibile', width / 2, height / 2);
      return;
    }
    
    // Dati per il grafico
    const timelineData = sortedTimeline;
    
    // Trova il valore minimo e massimo per la scala Y
    const yMin = Math.min(...timelineData.map(d => d.avgResponseTime)) * 0.9; // 10% di margine
    const yMax = Math.max(...timelineData.map(d => d.avgResponseTime)) * 1.1; // 10% di margine
    
    // Calcola la scala X (temporale)
    const xScale = (date: number) => {
      const dates = timelineData.map(d => d.date);
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      
      // Se c'è un solo punto, lo centri
      if (minDate === maxDate) return margin.left + innerWidth / 2;
      
      const scale = (date - minDate) / (maxDate - minDate);
      return margin.left + scale * innerWidth;
    };
    
    // Calcola la scala Y (tempo di risposta)
    const yScale = (value: number) => {
      const scale = (value - yMin) / (yMax - yMin);
      return margin.top + innerHeight - scale * innerHeight;
    };
    
    // Disegna gli assi
    ctx.strokeStyle = 'var(--vscode-editor-foreground)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Asse X
    ctx.moveTo(margin.left, margin.top + innerHeight);
    ctx.lineTo(margin.left + innerWidth, margin.top + innerHeight);
    
    // Asse Y
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + innerHeight);
    
    ctx.stroke();
    
    // Disegna le linee della griglia
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Griglia orizzontale
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + (innerHeight / yTicks) * i;
      
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + innerWidth, y);
      ctx.stroke();
      
      // Etichette Y
      const value = yMax - (i / yTicks) * (yMax - yMin);
      ctx.fillStyle = 'var(--vscode-foreground)';
      ctx.textAlign = 'right';
      ctx.fillText(formatResponseTime(value), margin.left - 10, y + 5);
    }
    
    // Etichette X (date)
    const xTicks = Math.min(7, timelineData.length);
    const tickInterval = Math.max(1, Math.floor(timelineData.length / xTicks));
    
    timelineData.forEach((data, i) => {
      if (i % tickInterval === 0 || i === timelineData.length - 1) {
        const x = xScale(data.date);
        const date = new Date(data.date);
        const dateStr = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        
        ctx.fillStyle = 'var(--vscode-foreground)';
        ctx.textAlign = 'center';
        ctx.fillText(dateStr, x, margin.top + innerHeight + 20);
      }
    });
    
    // Disegna la linea principale
    ctx.strokeStyle = 'var(--vscode-charts-blue)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    timelineData.forEach((data, i) => {
      const x = xScale(data.date);
      const y = yScale(data.avgResponseTime);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Disegna i punti
    ctx.fillStyle = 'var(--vscode-charts-blue)';
    
    timelineData.forEach(data => {
      const x = xScale(data.date);
      const y = yScale(data.avgResponseTime);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Aggiungi il titolo del grafico
    ctx.fillStyle = 'var(--vscode-foreground)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Tempo di risposta medio - ${provider}`, width / 2, margin.top / 2);
  };
  
  // Disegna il grafico all'avvio e quando cambiano i dati
  useEffect(() => {
    drawChart();
    
    // Ridisegna il grafico quando la finestra viene ridimensionata
    const handleResize = () => {
      drawChart();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [timeline, provider]);
  
  return (
    <Container>
      <Header>
        <Title>Timeline prestazioni - {provider} (ultimi {timeframe} giorni)</Title>
      </Header>
      
      <ChartContainer>
        <Canvas ref={canvasRef} />
      </ChartContainer>
      
      <StatsGrid>
        <StatCard>
          <StatTitle>Tempo medio</StatTitle>
          <StatValue>{formatResponseTime(avgResponseTime)}</StatValue>
        </StatCard>
        
        <StatCard>
          <StatTitle>Tempo più veloce</StatTitle>
          <StatValue>{formatResponseTime(minResponseTime)}</StatValue>
        </StatCard>
        
        <StatCard>
          <StatTitle>Tempo più lento</StatTitle>
          <StatValue>{formatResponseTime(maxResponseTime)}</StatValue>
        </StatCard>
        
        <StatCard>
          <StatTitle>Misurazioni</StatTitle>
          <StatValue>{sortedTimeline.length}</StatValue>
        </StatCard>
      </StatsGrid>
      
      <div style={{ marginTop: '1rem' }}>
        <p>
          Nota: Il grafico mostra l'andamento del tempo di risposta medio nel periodo selezionato.
          I punti rappresentano le singole sessioni di benchmark.
        </p>
      </div>
    </Container>
  );
}; 