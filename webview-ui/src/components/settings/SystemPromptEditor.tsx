import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  VSCodeButton, 
  VSCodeDivider,
  VSCodeTabs,
  VSCodeTab,
  VSCodeTabPanel,
  VSCodePanels,
  VSCodeCheckbox
} from '@vscode/webview-ui-toolkit/react';
import ReactMarkdown from 'react-markdown';
import { 
  getContextPromptSlot, 
  setContextPromptSlot, 
  resetPromptSlot,
  resetAllPrompts,
  initializePrompts,
  type PromptSlotType
} from '../../data/contextPromptManager';
import { webviewBridge } from '../../utils/WebviewBridge';
import { WebviewMessageType } from '../../../src/shared/types/webview.types';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
`;

const TextareaContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vscode-editor-foreground);
  background-color: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 2px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`;

const MarkdownPreview = styled.div`
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  font-family: var(--vscode-font-family);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vscode-editor-foreground);
  background-color: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 2px;
  overflow-y: auto;

  h1, h2, h3, h4, h5, h6 {
    color: var(--vscode-editor-foreground);
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  pre {
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 3px;
    padding: 0.5rem;
    overflow-x: auto;
  }

  code {
    font-family: var(--vscode-editor-font-family);
    background-color: var(--vscode-textCodeBlock-background);
    padding: 0.1rem 0.2rem;
    border-radius: 3px;
  }

  ul, ol {
    padding-left: 1.5rem;
  }

  blockquote {
    border-left: 3px solid var(--vscode-textLink-foreground);
    margin-left: 0;
    padding-left: 1rem;
    color: var(--vscode-descriptionForeground);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const StatusMessage = styled.div<{ isSuccess: boolean }>`
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: ${props => props.isSuccess 
    ? 'var(--vscode-terminal-ansiGreen)' 
    : 'var(--vscode-errorForeground)'};
  color: var(--vscode-editor-background);
  opacity: 0.9;
  margin-right: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
`;

const LoadingMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--vscode-descriptionForeground);
`;

const promptDescriptions: Record<PromptSlotType, string> = {
  system: "Definisce il comportamento base dell'assistente, le sue capacità e limitazioni principali.",
  user: "Specifica il contesto dell'utente e le aspettative comuni nelle interazioni con l'assistente.",
  persona: "Configura il \"carattere\" e lo stile comunicativo dell'assistente nelle risposte.",
  context: "Fornisce informazioni sul progetto attuale e il contesto tecnico di riferimento."
};

const promptPlaceholders: Record<PromptSlotType, string> = {
  system: `# System Prompt
  
Sei Jarvis, un assistente AI per sviluppatori integrato in VS Code.
Il tuo scopo è aiutare a scrivere, migliorare e comprendere il codice.`,

  user: `# User Context

Sono uno sviluppatore che lavora su un'estensione VS Code.
Mi aspetto risposte concrete e pragmatiche sui problemi di codice.`,

  persona: `# Personality Definition

- Professionale ma amichevole
- Pragmatico e orientato alle soluzioni
- Conciso ma completo`,

  context: `# Project Context

- Progetto: Jarvis IDE Extension
- Stack: TypeScript, React, VS Code API
- Obiettivo: migliorare l'interazione con l'AI`
};

interface SystemPromptEditorProps {
  onClose?: () => void;
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<PromptSlotType>('system');
  
  const [content, setContent] = useState<Record<PromptSlotType, string>>({
    system: '',
    user: '',
    persona: '',
    context: ''
  });
  
  const [originalContent, setOriginalContent] = useState<Record<PromptSlotType, string>>({
    system: '',
    user: '',
    persona: '',
    context: ''
  });
  
  const [showPreview, setShowPreview] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{text: string, isSuccess: boolean} | null>(null);

  useEffect(() => {
    async function loadPrompts() {
      try {
        setLoading(true);
        
        await initializePrompts();
        
        const initialContent: Record<PromptSlotType, string> = {
          system: getContextPromptSlot('system'),
          user: getContextPromptSlot('user'),
          persona: getContextPromptSlot('persona'),
          context: getContextPromptSlot('context')
        };
        
        setContent(initialContent);
        setOriginalContent({...initialContent});
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei prompt:', error);
        showStatusMessage('Errore nel caricamento dei prompt', false);
        setLoading(false);
      }
    }
    
    loadPrompts();
  }, []);
  
  const showStatusMessage = (text: string, isSuccess: boolean) => {
    setStatusMessage({ text, isSuccess });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent({
      ...content,
      [activeTab]: e.target.value
    });
  };

  const handleSave = () => {
    try {
      setContextPromptSlot(activeTab, content[activeTab]);
      
      setOriginalContent({
        ...originalContent,
        [activeTab]: content[activeTab]
      });
      
      showStatusMessage(`Prompt "${activeTab}" salvato con successo`, true);
    } catch (error) {
      console.error('Errore nel salvataggio del prompt:', error);
      showStatusMessage('Errore nel salvataggio', false);
    }
  };

  const handleSaveAll = () => {
    try {
      Object.entries(content).forEach(([key, value]) => {
        setContextPromptSlot(key as PromptSlotType, value);
      });
      
      setOriginalContent({...content});
      
      showStatusMessage('Tutti i prompt salvati con successo', true);
    } catch (error) {
      console.error('Errore nel salvataggio dei prompt:', error);
      showStatusMessage('Errore nel salvataggio', false);
    }
  };

  const handleReset = () => {
    setContent({
      ...content,
      [activeTab]: originalContent[activeTab]
    });
    showStatusMessage('Modifiche annullate', true);
  };

  const handleResetToDefault = () => {
    try {
      resetPromptSlot(activeTab);
      
      const resetContent = getContextPromptSlot(activeTab);
      
      setContent({
        ...content,
        [activeTab]: resetContent
      });
      
      setOriginalContent({
        ...originalContent,
        [activeTab]: resetContent
      });
      
      showStatusMessage(`Prompt "${activeTab}" ripristinato ai valori predefiniti`, true);
    } catch (error) {
      console.error('Errore nel ripristino del prompt:', error);
      showStatusMessage('Errore nel ripristino', false);
    }
  };

  const handleResetAllToDefault = () => {
    if (window.confirm('Sei sicuro di voler ripristinare TUTTI i prompt ai valori predefiniti?')) {
      try {
        resetAllPrompts();
        
        const resetContent = {
          system: getContextPromptSlot('system'),
          user: getContextPromptSlot('user'),
          persona: getContextPromptSlot('persona'),
          context: getContextPromptSlot('context')
        };
        
        setContent(resetContent);
        setOriginalContent({...resetContent});
        
        showStatusMessage('Tutti i prompt ripristinati ai valori predefiniti', true);
      } catch (error) {
        console.error('Errore nel ripristino dei prompt:', error);
        showStatusMessage('Errore nel ripristino', false);
      }
    }
  };

  const handleOpenInVSCode = () => {
    webviewBridge.sendMessage({
      type: WebviewMessageType.SAVE_SETTINGS,
      id: 'open-system-prompt-file',
      payload: {
        action: 'openFile',
        target: 'systemPrompt'
      }
    });
  };

  const handleTabChange = (e: CustomEvent) => {
    const newActiveTab = e.detail.id as PromptSlotType;
    setActiveTab(newActiveTab);
  };

  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  const hasChanges = content[activeTab] !== originalContent[activeTab];
  
  const hasAnyChanges = Object.keys(content).some(key => 
    content[key as PromptSlotType] !== originalContent[key as PromptSlotType]
  );

  return (
    <EditorContainer>
      <Header>
        <Title>Editor Prompt</Title>
        <CheckboxContainer>
          <VSCodeCheckbox checked={showPreview} onChange={handleTogglePreview}>
            Anteprima Markdown
          </VSCodeCheckbox>
        </CheckboxContainer>
      </Header>
      
      <Description>
        Personalizza i prompt che definiscono il comportamento dell'assistente AI.
        Utilizza i diversi tipi di prompt per configurare il sistema, il contesto utente,
        la personalità dell'assistente e il contesto del progetto.
      </Description>
      
      <VSCodeDivider />
      
      {loading ? (
        <LoadingMessage>Caricamento prompt...</LoadingMessage>
      ) : (
        <>
          <VSCodeTabs onTabChange={handleTabChange as any}>
            <VSCodeTab id="system">System</VSCodeTab>
            <VSCodeTab id="user">User</VSCodeTab>
            <VSCodeTab id="persona">Persona</VSCodeTab>
            <VSCodeTab id="context">Context</VSCodeTab>
          </VSCodeTabs>
          
          <Description>
            {promptDescriptions[activeTab]}
          </Description>
          
          <VSCodePanels>
            <VSCodeTabPanel>
              <TextareaContainer>
                {showPreview ? (
                  <MarkdownPreview>
                    <ReactMarkdown>{content[activeTab]}</ReactMarkdown>
                  </MarkdownPreview>
                ) : (
                  <Textarea 
                    value={content[activeTab]}
                    onChange={handleContentChange}
                    placeholder={promptPlaceholders[activeTab]}
                  />
                )}
              </TextareaContainer>
            </VSCodeTabPanel>
          </VSCodePanels>
          
          <Actions>
            {statusMessage && (
              <StatusMessage isSuccess={statusMessage.isSuccess}>
                {statusMessage.text}
              </StatusMessage>
            )}
            <VSCodeButton 
              appearance="secondary" 
              onClick={handleOpenInVSCode}
            >
              Apri in VS Code
            </VSCodeButton>
            <VSCodeButton 
              appearance="secondary" 
              onClick={handleResetToDefault}
            >
              Reset di default
            </VSCodeButton>
            <VSCodeButton 
              appearance="secondary" 
              onClick={handleReset} 
              disabled={!hasChanges}
            >
              Annulla modifiche
            </VSCodeButton>
            <VSCodeButton 
              onClick={handleSave} 
              disabled={!hasChanges}
            >
              Salva
            </VSCodeButton>
            <VSCodeButton 
              appearance="primary"
              onClick={handleSaveAll} 
              disabled={!hasAnyChanges}
            >
              Salva tutti
            </VSCodeButton>
            {onClose && (
              <VSCodeButton 
                appearance="secondary" 
                onClick={onClose}
              >
                Chiudi
              </VSCodeButton>
            )}
          </Actions>
          
          <VSCodeDivider />
          
          <Actions>
            <VSCodeButton 
              appearance="secondary"
              onClick={handleResetAllToDefault}
            >
              Reset globale (tutti i prompt)
            </VSCodeButton>
          </Actions>
        </>
      )}
    </EditorContainer>
  );
}; 