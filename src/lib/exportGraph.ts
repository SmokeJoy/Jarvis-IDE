import { toPng } from 'html-to-image';
import { Node, Edge } from 'reactflow';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    timestamp: number;
    strategy: string;
    selectedProvider: string;
    fallbackReason: string;
  };
}

export const exportGraphAsPNG = async (element: HTMLElement): Promise<string> => {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    return dataUrl;
  } catch (error) {
    console.error('Errore durante l\'export del grafo come PNG:', error);
    throw error;
  }
};

export const exportGraphAsJSON = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Errore durante l\'export del grafo come JSON:', error);
    throw error;
  }
};

export const downloadFile = (data: string, filename: string, type: string): void => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}; 