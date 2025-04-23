import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { TimelineStats } from '@/shared/WebviewMessage';
import Chart from 'chart.js/auto';

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

export const BenchmarkTimelineView: React.FC<BenchmarkTimelineViewProps> = ({ timeline, provider, timeframe }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Prepare data
    const labels = timeline.map(stat => new Date(stat.timestamp).toLocaleDateString());
    const responseTimeData = timeline.map(stat => stat.averageResponseTime);
    const successRateData = timeline.map(stat => stat.successRate * 100);

    // Create new chart
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tempo di risposta medio (ms)',
            data: responseTimeData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            yAxisID: 'y'
          },
          {
            label: 'Tasso di successo (%)',
            data: successRateData,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Tempo di risposta (ms)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Tasso di successo (%)'
            },
            grid: {
              drawOnChartArea: false
            },
            min: 0,
            max: 100
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [timeline]);

  // Calculate stats
  const averageResponseTime = timeline.length > 0
    ? timeline.reduce((sum, stat) => sum + stat.averageResponseTime, 0) / timeline.length
    : 0;

  const averageSuccessRate = timeline.length > 0
    ? (timeline.reduce((sum, stat) => sum + stat.successRate, 0) / timeline.length) * 100
    : 0;

  const totalRequests = timeline.reduce((sum, stat) => sum + stat.totalRequests, 0);

  return (
    <Container>
      <Header>
        <Title>Timeline delle Performance</Title>
      </Header>

      <ChartContainer>
        <Canvas ref={chartRef} />
      </ChartContainer>

      <StatsGrid>
        <StatCard>
          <StatTitle>Tempo di risposta medio</StatTitle>
          <StatValue>{averageResponseTime.toFixed(0)} ms</StatValue>
        </StatCard>

        <StatCard>
          <StatTitle>Tasso di successo medio</StatTitle>
          <StatValue>{averageSuccessRate.toFixed(1)}%</StatValue>
        </StatCard>

        <StatCard>
          <StatTitle>Richieste totali</StatTitle>
          <StatValue>{totalRequests}</StatValue>
        </StatCard>
      </StatsGrid>
    </Container>
  );
}; 