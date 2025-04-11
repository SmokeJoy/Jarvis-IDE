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
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '@radix-ui/react-tooltip';

interface DecisionGraphViewProps {
  entry: AIDebuggerOverlayProps;
}

const ProviderNode = React.memo(({ data }: { data: any }) => {
  const { isBlocked, getBlockReason } = useProviderBlacklist();
  const isBlockedProvider = isBlocked(data.id);
  const blockReason = isBlockedProvider ? getBlockReason(data.id) : null;

  return (
    <motion.div 
      initial={{ scale: 1 }}
      animate={{ 
        scale: isBlockedProvider ? [1, 1.05, 1] : 1,
        backgroundColor: isBlockedProvider ? '#991b1b' : 
          data.status === 'selected' ? '#059669' :
          data.status === 'excluded' ? '#dc2626' :
          '#4b5563'
      }}
      transition={{ 
        duration: 0.3,
        repeat: isBlockedProvider ? Infinity : 0,
        repeatDelay: 2
      }}
      className="px-4 py-2 rounded-lg shadow-lg"
    >
      <div className="text-white font-medium flex items-center justify-between">
        <span>{data.label}</span>
        {isBlockedProvider && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="text-xs font-bold text-red-300 bg-red-900/40 rounded px-2 py-1 cursor-help">
                🚫 Bloccato
              </div>
            </Tooltip.Trigger>
            <Tooltip.Content 
              className="bg-gray-900 text-white p-2 rounded shadow-lg max-w-xs"
              side="top"
            >
              <div className="text-sm font-medium">Provider Bloccato</div>
              <div className="text-xs text-gray-300 mt-1">
                {blockReason || "Provider bloccato tramite auto-mitigation"}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Ultimo aggiornamento: {new Date().toLocaleTimeString()}
              </div>
            </Tooltip.Content>
          </Tooltip.Root>
        )}
      </div>
      
      <AnimatePresence>
        {data.score && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-gray-200 mt-1"
          >
            score: {data.score}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {data.stats && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-gray-200 mt-1"
          >
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>latency: {data.stats.latency}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✅</span>
              <span>success: {(data.stats.successRate * 100).toFixed(1)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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