/**
 * Context React e Store Zustand per il componente AgentFlowDebugger
 */

import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import type { 
  AgentFlow, 
  AgentFlowDebuggerState, 
  InteractionFilters,
  DiagramOptions,
  Agent,
  AgentInteraction,
  InteractionType,
  InteractionStatus
} from '../types/agentFlow';
import { vscode } from '../utilities/vscode';
import type { AgentMessageUnion } from '@shared/messages';

interface AgentFlowStore extends AgentFlowDebuggerState {
  // Dati
  flow: AgentFlow | null;
  
  // Azioni
  setFlow: (flow: AgentFlow) => void;
  updateFlow: (flowUpdates: Partial<AgentFlow>) => void;
  setSelectedAgentId: (id: string | null) => void;
  setFilters: (filters: Partial<InteractionFilters>) => void;
  setDiagramOptions: (options: Partial<DiagramOptions>) => void;
  toggleLiveUpdating: () => void;
  setIsExporting: (isExporting: boolean) => void;
  setZoomLevel: (level: number) => void;
  reset: () => void;
  
  // Azioni derivate
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  removeAgent: (agentId: string) => void;
  addInteraction: (interaction: AgentInteraction) => void;
  removeInteraction: (interactionId: string) => void;
}

/**
 * Store Zustand per la gestione dello stato del componente AgentFlowDebugger
 */
export const useAgentFlowStore = create<AgentFlowStore>((set, get) => ({
  // Stato iniziale
  flow: null,
  selectedAgentId: null,
  filters: {},
  diagramOptions: {
    showTimestamps: true,
    animateInteractions: true,
    layout: 'TB',
    theme: 'default'
  },
  isLiveUpdating: true,
  isExporting: false,
  zoomLevel: 1,
  
  // Azioni
  setFlow: (flow) => set({ flow }),
  
  updateFlow: (flowUpdates) => set((state) => ({ 
    flow: state.flow ? { ...state.flow, ...flowUpdates } : null 
  })),
  
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  setDiagramOptions: (options) => set((state) => ({ 
    diagramOptions: { ...state.diagramOptions, ...options } 
  })),
  
  toggleLiveUpdating: () => set((state) => ({ 
    isLiveUpdating: !state.isLiveUpdating 
  })),
  
  setIsExporting: (isExporting) => set({ isExporting }),
  
  setZoomLevel: (level) => set({
    zoomLevel: Math.max(0.5, Math.min(2, level))
  }),
  
  reset: () => set({
    flow: null,
    selectedAgentId: null,
    filters: {},
    diagramOptions: {
      showTimestamps: true,
      animateInteractions: true,
      layout: 'TB',
      theme: 'default'
    },
    isLiveUpdating: true,
    isExporting: false,
    zoomLevel: 1
  }),
  
  // Azioni derivate
  addAgent: (agent) => set((state) => {
    if (!state.flow) return state;
    
    return {
      flow: {
        ...state.flow,
        agents: [...state.flow.agents, agent]
      }
    };
  }),
  
  updateAgent: (agentId, updates) => set((state) => {
    if (!state.flow) return state;
    
    return {
      flow: {
        ...state.flow,
        agents: state.flow.agents.map(agent => 
          agent.id === agentId ? { ...agent, ...updates } : agent
        )
      }
    };
  }),
  
  removeAgent: (agentId) => set((state) => {
    if (!state.flow) return state;
    
    return {
      flow: {
        ...state.flow,
        agents: state.flow.agents.filter(agent => agent.id !== agentId),
        interactions: state.flow.interactions.filter(
          interaction => interaction.fromAgentId !== agentId && interaction.toAgentId !== agentId
        )
      }
    };
  }),
  
  addInteraction: (interaction) => set((state) => {
    if (!state.flow) return state;
    
    return {
      flow: {
        ...state.flow,
        interactions: [...state.flow.interactions, interaction]
      }
    };
  }),
  
  removeInteraction: (interactionId) => set((state) => {
    if (!state.flow) return state;
    
    return {
      flow: {
        ...state.flow,
        interactions: state.flow.interactions.filter(
          interaction => interaction.id !== interactionId
        )
      }
    };
  })
}));

// Crea il context React
interface AgentFlowContextProps {
  children: React.ReactNode;
  initialFlow?: AgentFlow;
}

const AgentFlowContext = createContext<AgentFlowStore | null>(null);

/**
 * Provider per il Context di AgentFlow
 */
export function AgentFlowProvider({ children, initialFlow }: AgentFlowContextProps) {
  const store = useAgentFlowStore();
  
  // Imposta il flusso iniziale se fornito
  React.useEffect(() => {
    if (initialFlow) {
      store.setFlow(initialFlow);
    }
  }, [initialFlow]);

  return (
    <AgentFlowContext.Provider value={store}>
      {children}
    </AgentFlowContext.Provider>
  );
}

/**
 * Hook personalizzato per accedere al context AgentFlow
 */
export function useAgentFlowContext() {
  const context = useContext(AgentFlowContext);
  
  if (!context) {
    throw new Error('useAgentFlowContext deve essere utilizzato all\'interno di un AgentFlowProvider');
  }
  
  return context;
}

/**
 * Hook per filtrare le interazioni in base ai filtri correnti
 */
export function useFilteredInteractions() {
  const { flow, filters, selectedAgentId } = useAgentFlowStore();
  
  return React.useMemo(() => {
    if (!flow?.interactions) return [];
    
    return flow.interactions.filter(interaction => {
      // Filtra per agente selezionato
      if (selectedAgentId && !filters.agentIds?.includes(selectedAgentId)) {
        if (interaction.fromAgentId !== selectedAgentId && interaction.toAgentId !== selectedAgentId) {
          return false;
        }
      }
      
      // Filtra per agenti specifici
      if (filters.agentIds && filters.agentIds.length > 0) {
        if (!filters.agentIds.includes(interaction.fromAgentId) && 
            !filters.agentIds.includes(interaction.toAgentId)) {
          return false;
        }
      }
      
      // Filtra per intervallo di tempo
      if (filters.startTime && interaction.timestamp < filters.startTime) {
        return false;
      }
      
      if (filters.endTime && interaction.timestamp > filters.endTime) {
        return false;
      }
      
      // Filtra per tipo di interazione
      if (filters.types && filters.types.length > 0 && 
          !filters.types.includes(interaction.type)) {
        return false;
      }
      
      // Filtra per stato dell'interazione
      if (filters.statuses && filters.statuses.length > 0 && 
          !filters.statuses.includes(interaction.status)) {
        return false;
      }
      
      // Filtra per termine di ricerca
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.toLowerCase();
        return interaction.message.toLowerCase().includes(searchTerm);
      }
      
      return true;
    });
  }, [flow?.interactions, filters, selectedAgentId]);
}

// Interfacce per i tipi di dati
export interface Interaction {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'message' | 'command' | 'data' | 'feedback';
  content: string;
  status: 'pending' | 'completed' | 'error';
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface AgentFlow {
  agents: Agent[];
  interactions: Interaction[];
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  metadata?: Record<string, any>;
}

export interface AgentFlowFilters {
  interactionType: string | null;
  status: string | null;
  agentId: string | null;
  searchTerm: string | null;
  timeRange: [number, number] | null;
}

// Interfaccia per il contesto
interface AgentFlowContextType {
  flow: AgentFlow;
  updateFlow: (newFlow: Partial<AgentFlow>) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addInteraction: (interaction: Interaction) => void;
  updateInteraction: (id: string, updates: Partial<Interaction>) => void;
  diagramOptions: DiagramOptions;
  setDiagramOption: <K extends keyof DiagramOptions>(
    option: K,
    value: DiagramOptions[K]
  ) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  filters: AgentFlowFilters;
  setFilter: <K extends keyof AgentFlowFilters>(
    filter: K,
    value: AgentFlowFilters[K]
  ) => void;
  clearFilters: () => void;
  isLiveUpdating: boolean;
  setLiveUpdating: (isLive: boolean) => void;
  statistics: {
    agentCount: number;
    interactionCount: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

// Valori predefiniti per il contesto
const defaultFlow: AgentFlow = {
  agents: [],
  interactions: [],
  startTime: Date.now(),
  status: 'running',
};

const defaultOptions: DiagramOptions = {
  layout: 'TB',
  showTimestamps: true,
  animations: true,
  theme: 'system',
};

const defaultFilters: AgentFlowFilters = {
  interactionType: null,
  status: null,
  agentId: null,
  searchTerm: null,
  timeRange: null,
};

// Creazione del contesto
const AgentFlowContext = createContext<AgentFlowContextType | undefined>(undefined);

// Provider del contesto
export const AgentFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flow, setFlow] = React.useState<AgentFlow>(defaultFlow);
  const [diagramOptions, setDiagramOptions] = React.useState<DiagramOptions>(defaultOptions);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1.0);
  const [filters, setFilters] = React.useState<AgentFlowFilters>(defaultFilters);
  const [flow, setFlow] = useState<AgentFlow>(defaultFlow);
  const [diagramOptions, setDiagramOptions] = useState<DiagramOptions>(defaultOptions);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [filters, setFilters] = useState<AgentFlowFilters>(defaultFilters);
  const [isLiveUpdating, setLiveUpdating] = useState<boolean>(true);

  // Calcolo delle statistiche basate sul flusso corrente
  const statistics = React.useMemo(() => {
    const completedInteractions = flow.interactions.filter(i => i.status === 'completed');
    const errorInteractions = flow.interactions.filter(i => i.status === 'error');
    
    const totalDuration = completedInteractions.reduce((sum, i) => sum + (i.duration || 0), 0);
    const averageResponseTime = completedInteractions.length 
      ? totalDuration / completedInteractions.length 
      : 0;
    
    return {
      agentCount: flow.agents.length,
      interactionCount: flow.interactions.length,
      averageResponseTime,
      errorRate: flow.interactions.length 
        ? errorInteractions.length / flow.interactions.length 
        : 0,
    };
  }, [flow]);

  // Funzioni per manipolare il flusso
  const updateFlow = useCallback((newFlow: Partial<AgentFlow>) => {
    setFlow(current => ({ ...current, ...newFlow }));
  }, []);

  const addAgent = useCallback((agent: Agent) => {
    setFlow(current => ({
      ...current,
      agents: [...current.agents, agent],
    }));
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setFlow(current => ({
      ...current,
      agents: current.agents.map(agent => 
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    }));
  }, []);

  const addInteraction = useCallback((interaction: Interaction) => {
    setFlow(current => ({
      ...current,
      interactions: [...current.interactions, interaction],
    }));
  }, []);

  const updateInteraction = useCallback((id: string, updates: Partial<Interaction>) => {
    setFlow(current => ({
      ...current,
      interactions: current.interactions.map(interaction => 
        interaction.id === id ? { ...interaction, ...updates } : interaction
      ),
    }));
  }, []);

  // Funzione per impostare una singola opzione del diagramma
  const setDiagramOption = useCallback(<K extends keyof DiagramOptions>(
    option: K,
    value: DiagramOptions[K]
  ) => {
    setDiagramOptions(current => ({
      ...current,
      [option]: value,
    }));
  }, []);

  // Funzione per impostare un singolo filtro
  const setFilter = useCallback(<K extends keyof AgentFlowFilters>(
    filter: K,
    value: AgentFlowFilters[K]
  ) => {
    setFilters(current => ({
      ...current,
      [filter]: value,
    }));
  }, []);

  // Funzione per azzerare tutti i filtri
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Effetto per ricevere aggiornamenti dal webview host
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.command === 'updateAgentFlow') {
        if (isLiveUpdating) {
          if (message.data.agents) {
            updateFlow({ agents: message.data.agents });
          }
          if (message.data.interactions) {
            updateFlow({ interactions: message.data.interactions });
          }
          if (message.data.status) {
            updateFlow({ status: message.data.status });
          }
        }
      }
      
      if (message.command === 'resetAgentFlow') {
        setFlow({
          ...defaultFlow,
          startTime: Date.now(),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [updateFlow, isLiveUpdating]);

  // Valore del contesto
  const value = {
    flow,
    updateFlow,
    addAgent,
    updateAgent,
    addInteraction,
    updateInteraction,
    diagramOptions,
    setDiagramOption,
    zoomLevel,
    setZoomLevel,
    filters,
    setFilter,
    clearFilters,
    isLiveUpdating,
    setLiveUpdating,
    statistics,
  };

  return (
    <AgentFlowContext.Provider value={value}>
      {children}
    </AgentFlowContext.Provider>
  );
};

// Hook personalizzato per utilizzare il contesto
export const useAgentFlowStore = (): AgentFlowContextType => {
  const context = useContext(AgentFlowContext);
  
  if (context === undefined) {
    throw new Error('useAgentFlowStore deve essere utilizzato all\'interno di un AgentFlowProvider');
  }
  
  return context;
};

// Definizione dei tipi
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'waiting' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'request' | 'response' | 'error' | 'data';
  label: string;
  content?: string;
  timestamp: string;
}

export interface FlowData {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'error';
  startedAt: string;
  endedAt?: string;
  agents: Agent[];
  interactions: Interaction[];
  summary?: string;
}

interface AgentFlowContextType {
  flowData: FlowData | null;
  loading: boolean;
  error: string | null;
  fetchFlowData: (sessionId?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
}

// Creazione del contesto
const AgentFlowContext = createContext<AgentFlowContextType>({
  flowData: null,
  loading: false,
  error: null,
  fetchFlowData: async () => {},
  refreshData: async () => {},
  lastUpdated: null
});

// Hook personalizzato per utilizzare il contesto
export const useAgentFlow = () => useContext(AgentFlowContext);

interface AgentFlowProviderProps {
  children: React.ReactNode;
  sessionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AgentFlowProvider: React.FC<AgentFlowProviderProps> = ({
  children,
  sessionId,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);

  // Funzione per ottenere i dati del flusso
  const fetchFlowData = useCallback(async (newSessionId?: string) => {
    const targetSessionId = newSessionId || currentSessionId;
    
    if (!targetSessionId) {
      setError('ID sessione non specificato');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Richiedi i dati a VS Code
      const response = await vscode.postMessage({
        command: 'getAgentFlowData',
        sessionId: targetSessionId
      });
      
      // In un'applicazione reale, aspetteremmo la risposta da VS Code
      // Qui simuliamo una risposta con dati di esempio dopo un breve ritardo
      setTimeout(() => {
        // Dati di esempio per lo sviluppo
        const mockData: FlowData = {
          id: targetSessionId,
          name: `Sessione agenti ${targetSessionId}`,
          status: 'active',
          startedAt: new Date().toISOString(),
          agents: [
            {
              id: 'agent-1',
              name: 'Agente di pianificazione',
              type: 'planner',
              status: 'completed',
              createdAt: new Date(Date.now() - 120000).toISOString(),
              updatedAt: new Date(Date.now() - 90000).toISOString()
            },
            {
              id: 'agent-2',
              name: 'Agente di ricerca',
              type: 'searcher',
              status: 'active',
              createdAt: new Date(Date.now() - 90000).toISOString(),
              updatedAt: new Date(Date.now() - 30000).toISOString()
            },
            {
              id: 'agent-3',
              name: 'Agente di analisi',
              type: 'analyzer',
              status: 'waiting',
              createdAt: new Date(Date.now() - 60000).toISOString(),
              updatedAt: new Date(Date.now() - 60000).toISOString()
            }
          ],
          interactions: [
            {
              id: 'interaction-1',
              sourceId: 'agent-1',
              targetId: 'agent-2',
              type: 'request',
              label: 'Richiesta ricerca',
              content: 'Cerca dati sul comportamento degli utenti',
              timestamp: new Date(Date.now() - 90000).toISOString()
            },
            {
              id: 'interaction-2',
              sourceId: 'agent-2',
              targetId: 'agent-1',
              type: 'response',
              label: 'Risultati ricerca',
              content: 'Ecco i dati sul comportamento degli utenti: ...',
              timestamp: new Date(Date.now() - 60000).toISOString()
            },
            {
              id: 'interaction-3',
              sourceId: 'agent-1',
              targetId: 'agent-3',
              type: 'request',
              label: 'Richiesta analisi',
              content: 'Analizza questi risultati di ricerca',
              timestamp: new Date(Date.now() - 50000).toISOString()
            }
          ]
        };
        
        setFlowData(mockData);
        setLoading(false);
        setLastUpdated(new Date());
        
        if (newSessionId && newSessionId !== currentSessionId) {
          setCurrentSessionId(newSessionId);
        }
      }, 700); // Simulazione del tempo di risposta
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto durante il recupero dei dati');
      setLoading(false);
    }
  }, [currentSessionId]);

  // Funzione per aggiornare i dati
  const refreshData = useCallback(async () => {
    await fetchFlowData(currentSessionId);
  }, [fetchFlowData, currentSessionId]);

  // Carica i dati all'inizializzazione e quando cambia l'ID della sessione
  useEffect(() => {
    if (sessionId) {
      fetchFlowData(sessionId);
    }
  }, [sessionId, fetchFlowData]);

  // Configura l'aggiornamento automatico se abilitato
  useEffect(() => {
    if (!autoRefresh || !currentSessionId) return;
    
    const intervalId = setInterval(() => {
      refreshData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, currentSessionId, refreshData]);

  // Listener per i messaggi da VS Code (per un'applicazione reale)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.command === 'agentFlowDataUpdate' && 
          message.sessionId === currentSessionId) {
        setFlowData(message.data);
        setLastUpdated(new Date());
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentSessionId]);

  const value = {
    flowData,
    loading,
    error,
    fetchFlowData,
    refreshData,
    lastUpdated
  };

  return (
    <AgentFlowContext.Provider value={value}>
      {children}
    </AgentFlowContext.Provider>
  );
};

export default AgentFlowContext;

// --- MAS-compliant Agent State & Reducer ---
type AgentState = {
  threadId: string | null;
  typing: string | null;
  lastMessage?: unknown;
};

type AgentAction = AgentMessageUnion;

function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'agent.typing/state':
      return {
        ...state,
        typing: (msg.payload as unknown).agentId,
      };
    case 'agent.message/received':
      return {
        ...state,
        lastMessage: (msg.payload as unknown).message,
      };
    default:
      return state;
  }
}

// TODO: Integrare agentReducer nello store Zustand o nel nuovo context MAS 