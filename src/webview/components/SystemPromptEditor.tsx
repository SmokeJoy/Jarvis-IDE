import React, { useEffect, useState } from 'react';
import { getVsCodeApi } from '../vscode.js';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';
import type { WebviewMessage } from '../../types/webview.types.js';
import type { ExtensionMessage } from '../../shared/ExtensionMessage.js';

const vscode = getVsCodeApi();

export const SystemPromptEditor: React.FC = () => {
  const [promptContent, setPromptContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filePath, setFilePath] = useState('');

  useEffect(() => {
    // Carica il system prompt all'avvio
    vscode.postMessage({ type: 'getSystemPrompt' });

    // Listener per i messaggi dal backend
    const messageListener = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      if (message.type === 'systemPromptLoaded') {
        setPromptContent(message.content);
        setFilePath(message.filePath);
      }
    };

    window.addEventListener('message', messageListener);
    
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, []);

  const handleSave = () => {
    vscode.postMessage({
      type: 'saveSystemPrompt',
      content: promptContent
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Ricarica il contenuto originale
    vscode.postMessage({ type: 'getSystemPrompt' });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleOpenFile = () => {
    vscode.postMessage({ type: 'openSystemPromptFile' });
  };

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">System Prompt</h3>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                className="bg-green-600 text-white px-2 py-1 rounded text-sm"
              >
                Salva
              </button>
              <button 
                onClick={handleCancel}
                className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
              >
                Annulla
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleEdit}
                className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
              >
                Modifica
              </button>
              <button 
                onClick={handleOpenFile}
                className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
              >
                Apri File
              </button>
            </>
          )}
        </div>
      </div>

      {filePath && (
        <div className="text-xs text-gray-400 mb-2">
          {filePath}
        </div>
      )}

      {isEditing ? (
        <textarea
          value={promptContent}
          onChange={(e) => setPromptContent(e.target.value)}
          className="w-full h-64 bg-slate-900 text-white p-2 rounded font-mono text-sm"
        />
      ) : (
        <Tabs defaultValue="preview">
          <TabsList className="mb-2">
            <TabsTrigger value="preview">Anteprima</TabsTrigger>
            <TabsTrigger value="source">Sorgente</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="h-64 overflow-auto bg-slate-900 p-3 rounded">
            <ReactMarkdown className="prose prose-invert">
              {promptContent}
            </ReactMarkdown>
          </TabsContent>
          <TabsContent value="source" className="h-64 overflow-auto bg-slate-900 p-3 rounded font-mono text-sm whitespace-pre-wrap">
            {promptContent}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};