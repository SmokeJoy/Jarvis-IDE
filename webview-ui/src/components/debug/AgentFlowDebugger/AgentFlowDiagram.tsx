import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useAgentFlow } from '../../../context/AgentFlowContext';
import './styles.css';

interface AgentFlowDiagramProps {
  filters: {
    search: string;
    status: string[];
    interactionType: string[];
    timeRange: [number, number] | null;
    zoom: number;
  };
}

/**
 * Componente che renderizza un diagramma di flusso degli agenti utilizzando mermaid.js
 */
const AgentFlowDiagram: React.FC<AgentFlowDiagramProps> = ({ filters }) => {
  const { flowData, loading, error } = useAgentFlow();
  const [diagramId] = useState(`diagram-${Math.random().toString(36).substring(2, 11)}`);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Inizializzazione di mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: document.body.classList.contains('vscode-dark') ? 'dark' : 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      securityLevel: 'loose'
    });
  }, []);

  // Costruzione e rendering del diagramma quando i dati o i filtri cambiano
  useEffect(() => {
    if (!flowData || loading || !containerRef.current) return;

    const renderDiagram = async () => {
      try {
        // Filtra i dati in base ai filtri applicati
        const filteredAgents = filterAgents(flowData.agents, filters);
        const filteredInteractions = filterInteractions(flowData.interactions, filteredAgents, filters);
        
        // Genera la definizione del diagramma mermaid
        const diagramDefinition = generateMermaidDefinition(
          filteredAgents, 
          filteredInteractions,
          filters.zoom
        );
        
        // Pulisci il container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const diagramContainer = document.createElement('div');
          diagramContainer.id = diagramId;
          containerRef.current.appendChild(diagramContainer);
          
          // Renderizza il diagramma
          await mermaid.render(diagramId, diagramDefinition)
            .then(result => {
              if (containerRef.current) {
                document.getElementById(diagramId)!.innerHTML = result.svg;
              }
            });
        }
      } catch (err) {
        console.error('Errore durante il rendering del diagramma:', err);
        if (containerRef.current) {
          containerRef.current.innerHTML = 
            '<div class="agentflowdebugger-diagram-error">Errore durante il rendering del diagramma</div>';
        }
      }
    };

    renderDiagram();
  }, [flowData, filters, loading, diagramId]);

  // Funzione di filtro degli agenti
  const filterAgents = (agents: any[], filters: AgentFlowDiagramProps['filters']) => {
    if (!agents) return [];
    
    return agents.filter(agent => {
      // Filtro per ricerca
      const matchesSearch = !filters.search || 
        agent.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        agent.id.toLowerCase().includes(filters.search.toLowerCase());
      
      // Filtro per stato
      const matchesStatus = filters.status.length === 0 || 
        filters.status.includes(agent.status);
      
      return matchesSearch && matchesStatus;
    });
  };

  // Funzione di filtro delle interazioni
  const filterInteractions = (
    interactions: any[], 
    filteredAgents: any[],
    filters: AgentFlowDiagramProps['filters']
  ) => {
    if (!interactions) return [];
    
    const agentIds = filteredAgents.map(agent => agent.id);
    
    return interactions.filter(interaction => {
      // Considera solo le interazioni tra gli agenti filtrati
      const involvesFilteredAgents = 
        agentIds.includes(interaction.sourceId) && 
        agentIds.includes(interaction.targetId);
      
      // Filtro per tipo di interazione
      const matchesType = filters.interactionType.length === 0 || 
        filters.interactionType.includes(interaction.type || 'unknown');
      
      return involvesFilteredAgents && matchesType;
    });
  };

  // Funzione per generare la definizione del diagramma mermaid
  const generateMermaidDefinition = (
    agents: any[], 
    interactions: any[],
    zoom: number = 100
  ) => {
    const scale = zoom / 100;
    
    let definition = `flowchart TD\n`;
    definition += `    %% Impostazioni\n`;
    definition += `    linkStyle default stroke:#666,stroke-width:2px\n`;
    
    // Definizione degli agenti
    agents.forEach(agent => {
      let style = '';
      switch (agent.status) {
        case 'active':
          style = 'fill:#e1f5fe,stroke:#03a9f4,color:#01579b';
          break;
        case 'completed':
          style = 'fill:#e8f5e9,stroke:#4caf50,color:#1b5e20';
          break;
        case 'error':
          style = 'fill:#ffebee,stroke:#f44336,color:#b71c1c';
          break;
        case 'waiting':
          style = 'fill:#fff3e0,stroke:#ff9800,color:#e65100';
          break;
        default:
          style = 'fill:#f5f5f5,stroke:#9e9e9e,color:#212121';
      }
      
      definition += `    ${agent.id}["${sanitizeText(agent.name)}"] ${scale !== 1 ? `:::${agent.status} ` : ''}style ${agent.id} ${style}\n`;
    });
    
    // Definizione delle interazioni
    interactions.forEach((interaction, index) => {
      const label = sanitizeText(interaction.label || '');
      const style = getInteractionStyle(interaction.type);
      
      definition += `    ${interaction.sourceId} -->|${label}| ${interaction.targetId}\n`;
      definition += `    style ${interaction.sourceId}-->${interaction.targetId} ${style}\n`;
    });
    
    // Aggiungiamo le classi per lo zoom se necessario
    if (scale !== 1) {
      definition += `\n    %% Scala diagramma\n`;
      definition += `    classDef active width:${150 * scale}px,height:${80 * scale}px\n`;
      definition += `    classDef completed width:${150 * scale}px,height:${80 * scale}px\n`;
      definition += `    classDef error width:${150 * scale}px,height:${80 * scale}px\n`;
      definition += `    classDef waiting width:${150 * scale}px,height:${80 * scale}px\n`;
    }
    
    return definition;
  };

  // Funzione per sanitizzare il testo per mermaid
  const sanitizeText = (text: string) => {
    return text.replace(/"/g, '&quot;');
  };

  // Funzione per ottenere lo stile delle interazioni
  const getInteractionStyle = (type: string = 'default') => {
    switch (type) {
      case 'request':
        return 'stroke:#2196f3,stroke-width:2px,stroke-dasharray:5 5';
      case 'response':
        return 'stroke:#4caf50,stroke-width:2px';
      case 'error':
        return 'stroke:#f44336,stroke-width:2px';
      case 'data':
        return 'stroke:#673ab7,stroke-width:2px,stroke-dasharray:1 1';
      default:
        return 'stroke:#9e9e9e,stroke-width:2px';
    }
  };

  if (loading) {
    return (
      <div className="agentflowdebugger-diagram-container">
        <div className="agentflowdebugger-diagram-loading">
          Caricamento del diagramma...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agentflowdebugger-diagram-container">
        <div className="agentflowdebugger-diagram-error">
          Errore durante il caricamento dei dati: {error}
        </div>
      </div>
    );
  }

  if (!flowData || !flowData.agents || flowData.agents.length === 0) {
    return (
      <div className="agentflowdebugger-diagram-container">
        <div className="agentflowdebugger-diagram-empty">
          Nessun dato di flusso disponibile. Avvia un'esecuzione per vedere il diagramma.
        </div>
      </div>
    );
  }

  return (
    <div 
      className="agentflowdebugger-diagram-container"
      style={{ transform: `scale(${filters.zoom / 100})` }}
    >
      <div ref={containerRef} className="agentflowdebugger-diagram" />
    </div>
  );
};

export default AgentFlowDiagram; 