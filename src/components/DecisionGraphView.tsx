import React, { useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDecisionGraphData } from '../hooks/useDecisionGraphData';
import { useProviderBlacklist } from '../hooks/useProviderBlacklist';
import { AIDebuggerOverlayProps } from './AIDebuggerOverlay';
import { exportGraphAsPNG, exportGraphAsJSON, downloadFile } from '../lib/exportGraph';
import { motion } from 'framer-motion';

interface DecisionGraphViewProps {
  entry: AIDebuggerOverlayProps;
}

const ProviderNode = React.memo(({ data }: { data: any }) => {
  const { isBlocked } = useProviderBlacklist();
  const isBlockedProvider = isBlocked(data.id);

  return (
    <div 
      className={`px-4 py-2 rounded-lg shadow-lg ${
        isBlockedProvider ? 'bg-red-800' :
        data.status === 'selected' ? 'bg-green-600' :
        data.status === 'excluded' ? 'bg-red-600' :
        'bg-gray-600'
      }`}
      title={isBlockedProvider ? "Provider bloccato tramite auto-mitigation" : undefined}
    >
      <div className="text-white font-medium">{data.label}</div>
      {isBlockedProvider && (
        <div className="text-xs font-bold text-red-300 bg-red-900/40 rounded px-1 mt-1">
          🚫 Bloccato
        </div>
      )}
      {data.score && (
        <div className="text-xs text-gray-200">score: {data.score}</div>
      )}
      {data.stats && (
        <div className="text-xs text-gray-200">
          <div>latency: {data.stats.latency}ms</div>
          <div>success: {(data.stats.successRate * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
});

const nodeTypes = {
  provider: ProviderNode,
  strategy: ({ data }: { data: any }) => (
    <div className="px-4 py-2 rounded-lg shadow-lg bg-blue-600">
      <div className="text-white font-medium">{data.label}</div>
    </div>
  )
};

const edgeTypes = {
  default: {
    style: { stroke: '#94a3b8' },
    animated: false
  },
  selected: {
    style: { stroke: '#10b981' },
    animated: true
  }
};

export const DecisionGraphView: React.FC<DecisionGraphViewProps> = ({ entry }) => {
  const { nodes, edges } = useDecisionGraphData(entry);
  const graphRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (!graphRef.current) return;
    
    try {
      const dataUrl = await exportGraphAsPNG(graphRef.current);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(dataUrl, `decision-graph-${timestamp}.png`, 'image/png');
    } catch (error) {
      console.error('Errore durante l\'export del grafo come PNG:', error);
    }
  };

  const handleExportJSON = () => {
    try {
      const graphData = {
        nodes: nodes,
        edges: edges,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      const jsonString = exportGraphAsJSON(graphData);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(jsonString, `decision-graph-${timestamp}.json`, 'application/json');
    } catch (error) {
      console.error('Errore durante l\'export del grafo come JSON:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={graphRef} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportPNG}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Export PNG
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportJSON}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Export JSON
        </motion.button>
      </div>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 p-3 rounded-lg text-white text-sm">
        <div className="font-bold mb-2">Legenda</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>Provider selezionato</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>Provider escluso</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-red-800 rounded"></div>
          <span>Provider bloccato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Strategia</span>
        </div>
      </div>
    </div>
  );
}; 