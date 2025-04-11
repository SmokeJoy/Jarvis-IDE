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
import { AIDebuggerOverlayProps } from './AIDebuggerOverlay';
import { exportGraphAsPNG, exportGraphAsJSON, downloadFile } from '../lib/exportGraph';
import { motion } from 'framer-motion';

interface DecisionGraphViewProps {
  entry: AIDebuggerOverlayProps;
}

const nodeTypes = {
  provider: ({ data }: { data: any }) => (
    <div className={`px-4 py-2 rounded-lg shadow-lg ${
      data.status === 'selected' ? 'bg-green-600' :
      data.status === 'excluded' ? 'bg-red-600' :
      'bg-gray-600'
    }`}>
      <div className="text-white font-medium">{data.label}</div>
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
  ),
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
    </div>
  );
}; 