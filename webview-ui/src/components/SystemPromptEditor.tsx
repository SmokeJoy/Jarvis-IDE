import React, { useEffect, useState } from 'react';
import { VSCodeButton, VSCodeTextArea, VSCodeDivider, VSCodeTabs, VSCodeTab, VSCodeTabPanel } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { 
  initializePrompts, 
  getContextPromptSlot, 
  setContextPromptSlot, 
  resetPromptSlot,
  resetAllPrompts,
  PromptSlotType
} from '../data/contextPromptManager';

const EditorContainer = styled.div`
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const EditorTitle = styled.h3`
  margin: 0;
  padding: 0;
`;

const TextAreaContainer = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`;

const TabWrapper = styled.div`
  margin-bottom: 1rem;
`;

const PreviewContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  background-color: var(--vscode-panel-background);
  max-height: 300px;
  overflow-y: auto;
`;

const StatusMessage = styled.span`
  font-size: 0.9rem;
  color: var(--vscode-successForeground);
  margin-left: 1rem;
  opacity: ${props => (props.visible ? '1' : '0')};
  transition: opacity 0.3s ease;
`;

// Descrizioni per ogni tipo di prompt
const PROMPT_DESCRIPTIONS = {
  system: "Il system prompt definisce il comportamento di base dell'assistente AI e le sue capacità generali.",
  user: "Il prompt utente stabilisce il contesto della richiesta tipica e i tipi di domande attese.",
  persona: "Il prompt di persona configura il 'carattere' dell'assistente, il suo stile comunicativo e le sue preferenze.",
  context: "Il prompt di contesto definisce informazioni sul progetto attuale, il dominio di lavoro e altre informazioni contestuali."
};

export const SystemPromptEditor: React.FC = () => {
  // Stato per ogni tipo di prompt
  const [activeTab, setActiveTab] = useState<PromptSlotType>('system');
  const [promptValues, setPromptValues] = useState<Record<PromptSlotType, string>>({
    system: '',
    user: '',
    persona: '',
    context: ''
  });
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Carica i prompt all'avvio
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        await initializePrompts();
        setPromptValues({
          system: getContextPromptSlot('system'),
          user: getContextPromptSlot('user'),
          persona: getContextPromptSlot('persona'),
          context: getContextPromptSlot('context')
        });
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei prompt:', error);
        setLoading(false);
      }
    };

    loadPrompts();
  }, []);

  // Gestisce il cambio di tab
  const handleTabChange = (tab: PromptSlotType) => {
    setActiveTab(tab);
  };

  // Gestisce il cambio di valore del prompt
  const handlePromptChange = (value: string) => {
    setPromptValues({
      ...promptValues,
      [activeTab]: value
    });
  };

  // Salva il prompt corrente
  const handleSave = () => {
    setContextPromptSlot(activeTab, promptValues[activeTab]);
    showStatusMessage('Prompt salvato!');
  };

  // Ripristina il prompt corrente
  const handleReset = () => {
    if (window.confirm(`Sei sicuro di voler ripristinare il prompt "${activeTab}" al valore predefinito?`)) {
      resetPromptSlot(activeTab);
      setPromptValues({
        ...promptValues,
        [activeTab]: getContextPromptSlot(activeTab)
      });
      showStatusMessage('Prompt ripristinato!');
    }
  };

  // Ripristina tutti i prompt
  const handleResetAll = () => {
    if (window.confirm('Sei sicuro di voler ripristinare TUTTI i prompt ai valori predefiniti?')) {
      resetAllPrompts();
      setPromptValues({
        system: getContextPromptSlot('system'),
        user: getContextPromptSlot('user'),
        persona: getContextPromptSlot('persona'),
        context: getContextPromptSlot('context')
      });
      showStatusMessage('Tutti i prompt sono stati ripristinati!');
    }
  };

  // Toggle anteprima Markdown
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Mostra un messaggio di stato temporaneo
  const showStatusMessage = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 2000);
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>AI Prompt Editor</EditorTitle>
        <StatusMessage visible={!!statusMessage}>{statusMessage}</StatusMessage>
      </EditorHeader>
      
      <Description>
        Configura e personalizza i prompt dell'assistente AI con il nuovo editor multi-slot.
      </Description>
      
      <TabWrapper>
        <VSCodeTabs>
          <VSCodeTab id="tab-system" onClick={() => handleTabChange('system')}>System</VSCodeTab>
          <VSCodeTab id="tab-user" onClick={() => handleTabChange('user')}>User</VSCodeTab>
          <VSCodeTab id="tab-persona" onClick={() => handleTabChange('persona')}>Persona</VSCodeTab>
          <VSCodeTab id="tab-context" onClick={() => handleTabChange('context')}>Context</VSCodeTab>
          
          <VSCodeTabPanel id="panel-system">
            <Description>{PROMPT_DESCRIPTIONS.system}</Description>
          </VSCodeTabPanel>
          <VSCodeTabPanel id="panel-user">
            <Description>{PROMPT_DESCRIPTIONS.user}</Description>
          </VSCodeTabPanel>
          <VSCodeTabPanel id="panel-persona">
            <Description>{PROMPT_DESCRIPTIONS.persona}</Description>
          </VSCodeTabPanel>
          <VSCodeTabPanel id="panel-context">
            <Description>{PROMPT_DESCRIPTIONS.context}</Description>
          </VSCodeTabPanel>
        </VSCodeTabs>
      </TabWrapper>
      
      <TextAreaContainer>
        <VSCodeTextArea 
          rows={12}
          value={promptValues[activeTab]} 
          onChange={(e: any) => handlePromptChange(e.target.value)}
          placeholder="Caricamento in corso..."
          style={{ width: '100%', minHeight: '200px' }}
          disabled={loading}
        />
      </TextAreaContainer>
      
      {showPreview && (
        <PreviewContainer>
          <ReactMarkdown>{promptValues[activeTab]}</ReactMarkdown>
        </PreviewContainer>
      )}
      
      <ButtonContainer>
        <VSCodeButton onClick={handleSave} disabled={loading}>
          Salva
        </VSCodeButton>
        <VSCodeButton onClick={handleReset} disabled={loading} appearance="secondary">
          Ripristina
        </VSCodeButton>
        <VSCodeButton onClick={handleResetAll} disabled={loading} appearance="secondary">
          Ripristina Tutti
        </VSCodeButton>
        <VSCodeButton onClick={handleTogglePreview} disabled={loading} appearance="icon">
          {showPreview ? 'Nascondi Preview' : 'Mostra Preview'}
        </VSCodeButton>
      </ButtonContainer>
      
      <VSCodeDivider style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }} />
    </EditorContainer>
  );
}; 