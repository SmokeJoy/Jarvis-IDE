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
  getActiveProfile,
  type PromptProfile,
  type PromptSlotType
} from '../../data/contextPromptManager';
import { ProfileSelector } from './ProfileSelector';
import { ProfileManagerModal } from './ProfileManagerModal';
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
  
  const [activeProfile, setActiveProfile] = useState<PromptProfile | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);

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
        
        const profile = getActiveProfile();
        setActiveProfile(profile);
        
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

  const handleProfileChange = (profile: PromptProfile) => {
    try {
      setLoading(true);
      
      setActiveProfile(profile);
      
      const newContent: Record<PromptSlotType, string> = {
        system: getContextPromptSlot('system'),
        user: getContextPromptSlot('user'),
        persona: getContextPromptSlot('persona'),
        context: getContextPromptSlot('context')
      };
      
      setContent(newContent);
      setOriginalContent({...newContent});
      
      showStatusMessage(`Profilo cambiato: ${profile.name}`, true);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel cambio di profilo:', error);
      showStatusMessage('Errore nel cambio di profilo', false);
      setLoading(false);
    }
  };

  const handleManageProfiles = () => {
    setShowProfileManager(true);
  };

  const handleTabChange = (e: Event) => {
    const target = e.target as HTMLElement;
    const newTab = target.getAttribute('aria-controls') as PromptSlotType;
    if (newTab) {
      setActiveTab(newTab);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent({...content, [activeTab]: newContent});
  };

  const handleSaveChanges = async () => {
    try {
      await setContextPromptSlot(activeTab, content[activeTab]);
      
      setOriginalContent({...originalContent, [activeTab]: content[activeTab]});
      
      showStatusMessage('Modifiche salvate', true);
    } catch (error) {
      console.error('Errore nel salvataggio del prompt:', error);
      showStatusMessage('Errore nel salvataggio', false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      await resetPromptSlot(activeTab);
      
      const newContent = getContextPromptSlot(activeTab);
      setContent({...content, [activeTab]: newContent});
      setOriginalContent({...originalContent, [activeTab]: newContent});
      
      showStatusMessage('Ripristinato il valore predefinito', true);
    } catch (error) {
      console.error('Errore nel ripristino del prompt:', error);
      showStatusMessage('Errore nel ripristino', false);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetAllPrompts();
      
      const newContent: Record<PromptSlotType, string> = {
        system: getContextPromptSlot('system'),
        user: getContextPromptSlot('user'),
        persona: getContextPromptSlot('persona'),
        context: getContextPromptSlot('context')
      };
      
      setContent(newContent);
      setOriginalContent({...newContent});
      
      showStatusMessage('Tutti i prompt sono stati ripristinati', true);
    } catch (error) {
      console.error('Errore nel ripristino di tutti i prompt:', error);
      showStatusMessage('Errore nel ripristino', false);
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

  const isDirty = content[activeTab] !== originalContent[activeTab];
  
  if (loading) {
    return <LoadingMessage>Caricamento degli editor di prompt...</LoadingMessage>;
  }
  
  return (
    <EditorContainer>
      <Header>
        <Title>Editor Prompt di Sistema</Title>
        {onClose && (
          <VSCodeButton onClick={onClose}>
            Chiudi
          </VSCodeButton>
        )}
      </Header>
      
      <Description>
        Personalizza i prompt utilizzati dall'assistente AI per definire il suo comportamento, contesto e personalità.
      </Description>
      
      <ProfileSelector 
        onManageClick={handleManageProfiles}
        onProfileChange={handleProfileChange}
      />
      
      <VSCodePanels activeid={activeTab} onTabChange={handleTabChange}>
        <VSCodeTabs>
          <VSCodeTab id="system" aria-controls="system">Sistema</VSCodeTab>
          <VSCodeTab id="user" aria-controls="user">Utente</VSCodeTab>
          <VSCodeTab id="persona" aria-controls="persona">Personalità</VSCodeTab>
          <VSCodeTab id="context" aria-controls="context">Contesto</VSCodeTab>
        </VSCodeTabs>
        
        <VSCodeTabPanel id="system">
          <Description>{promptDescriptions.system}</Description>
        </VSCodeTabPanel>
        <VSCodeTabPanel id="user">
          <Description>{promptDescriptions.user}</Description>
        </VSCodeTabPanel>
        <VSCodeTabPanel id="persona">
          <Description>{promptDescriptions.persona}</Description>
        </VSCodeTabPanel>
        <VSCodeTabPanel id="context">
          <Description>{promptDescriptions.context}</Description>
        </VSCodeTabPanel>
      </VSCodePanels>
      
      <VSCodeDivider style={{ margin: '1rem 0' }} />
      
      <Header>
        <CheckboxContainer>
          <VSCodeCheckbox
            checked={showPreview}
            onChange={() => setShowPreview(!showPreview)}
          >
            Anteprima Markdown
          </VSCodeCheckbox>
        </CheckboxContainer>
      </Header>
      
      {!showPreview ? (
        <TextareaContainer>
          <Textarea
            value={content[activeTab]}
            onChange={handleContentChange}
            placeholder={promptPlaceholders[activeTab]}
          />
        </TextareaContainer>
      ) : (
        <MarkdownPreview>
          <ReactMarkdown>{content[activeTab] || '*Nessun contenuto*'}</ReactMarkdown>
        </MarkdownPreview>
      )}
      
      <Actions>
        {statusMessage && (
          <StatusMessage isSuccess={statusMessage.isSuccess}>
            {statusMessage.text}
          </StatusMessage>
        )}
        
        <VSCodeButton
          appearance="secondary"
          onClick={handleResetToDefault}
        >
          Ripristina Default
        </VSCodeButton>
        
        <VSCodeButton
          appearance="secondary"
          onClick={handleResetAll}
        >
          Ripristina Tutti
        </VSCodeButton>
        
        <VSCodeButton
          disabled={!isDirty}
          onClick={handleSaveChanges}
        >
          Salva Modifiche
        </VSCodeButton>
      </Actions>
      
      {showProfileManager && (
        <ProfileManagerModal 
          onClose={() => setShowProfileManager(false)}
          onProfileChange={handleProfileChange}
        />
      )}
    </EditorContainer>
  );
}; 