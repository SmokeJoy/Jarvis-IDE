import React, { useEffect, useState } from 'react';
import { VSCodeCheckbox, VSCodeRadio, VSCodeRadioGroup, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import styled from 'styled-components';
import { vscode } from '../utils/vscode';
import { WebviewMessageType } from '../../src/shared/WebviewMessageType';
import { useExtensionState } from '../context/ExtensionStateContext';

const ToggleContainer = styled.div`
  margin: 1.5rem 0;
`;

const ToggleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

const ToggleTitle = styled.h3`
  margin: 0;
  padding: 0;
`;

const Description = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`;

const ToggleLabel = styled.span`
  font-size: 1rem;
  margin-left: 0.5rem;
`;

const Tag = styled.span`
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--vscode-activityBarBadge-background);
  color: var(--vscode-activityBarBadge-foreground);
  margin-left: 0.8rem;
  vertical-align: middle;
`;

const CoderOptionsSection = styled.div<{ $visible: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--vscode-editor-selectionBackground);
  border-radius: 4px;
  border-left: 4px solid var(--vscode-activityBarBadge-background);
  display: ${props => props.$visible ? 'block' : 'none'};
  transition: opacity 0.3s ease;
  opacity: ${props => props.$visible ? 1 : 0};
`;

const OptionTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
`;

const RadioDescription = styled.p`
  font-size: 0.85rem;
  opacity: 0.9;
  margin: 0.2rem 0 0 1.8rem;
`;

const OptionGroup = styled.div`
  margin-bottom: 1rem;
`;

const OptionDivider = styled(VSCodeDivider)`
  margin: 1rem 0;
`;

const MultiAgentContainer = styled.div`
  margin-top: 1rem;
`;

const ExperimentalTag = styled.span`
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--vscode-statusBarItem-warningBackground);
  color: var(--vscode-statusBarItem-warningForeground);
  margin-left: 0.8rem;
  vertical-align: middle;
`;

export const CoderModeToggle: React.FC = () => {
  const { state } = useExtensionState();
  const [isCoderMode, setIsCoderMode] = useState(false);
  const [isMultiAgent, setIsMultiAgent] = useState(false);
  const [codeStyle, setCodeStyle] = useState('standard');

  useEffect(() => {
    // Inizializza i valori dal contesto
    if (state.coder_mode !== undefined) {
      setIsCoderMode(state.coder_mode);
    }
    
    // Inizializza lo stile del codice se disponibile
    if (state.code_style) {
      setCodeStyle(state.code_style);
    }
    
    // Inizializza la modalità multi-agent
    if (state.multi_agent !== undefined) {
      setIsMultiAgent(state.multi_agent);
    }
  }, [state.coder_mode, state.code_style, state.multi_agent]);

  const handleToggle = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    
    setIsCoderMode(newValue);
    
    // Se disattiviamo la modalità coder, disattiviamo anche multi-agent
    if (!newValue && isMultiAgent) {
      setIsMultiAgent(false);
      vscode.postMessage({
        type: WebviewMessageType.UPDATE_SETTING,
        key: 'multi_agent',
        value: false
      });
    }
    
    // Aggiorna le impostazioni nell'estensione
    vscode.postMessage({
      type: WebviewMessageType.UPDATE_SETTING,
      key: 'coder_mode',
      value: newValue
    });
  };
  
  const handleCodeStyleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setCodeStyle(target.value);
    
    // Aggiorna le impostazioni nell'estensione
    vscode.postMessage({
      type: WebviewMessageType.UPDATE_SETTING,
      key: 'code_style',
      value: target.value
    });
  };
  
  const handleMultiAgentToggle = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    
    // Attiva automaticamente la modalità coder se attiviamo multi-agent
    if (newValue && !isCoderMode) {
      setIsCoderMode(true);
      vscode.postMessage({
        type: WebviewMessageType.UPDATE_SETTING,
        key: 'coder_mode',
        value: true
      });
    }
    
    setIsMultiAgent(newValue);
    
    // Aggiorna le impostazioni nell'estensione
    vscode.postMessage({
      type: WebviewMessageType.UPDATE_SETTING,
      key: 'multi_agent',
      value: newValue
    });
  };

  return (
    <ToggleContainer>
      <ToggleHeader>
        <ToggleTitle>Modalità Sviluppatore</ToggleTitle>
      </ToggleHeader>
      
      <Description>
        Attiva la modalità sviluppatore per ottimizzare le risposte dell'assistente 
        per la programmazione, con funzioni avanzate di analisi e generazione di codice.
      </Description>
      
      <div>
        <VSCodeCheckbox checked={isCoderMode} onChange={handleToggle}>
          <ToggleLabel>Attiva modalità sviluppatore</ToggleLabel>
          {isCoderMode && <Tag>Attivo</Tag>}
        </VSCodeCheckbox>
      </div>
      
      <CoderOptionsSection $visible={isCoderMode}>
        <OptionGroup>
          <OptionTitle>Opzioni di generazione codice</OptionTitle>
          
          <VSCodeRadioGroup value={codeStyle} onChange={handleCodeStyleChange}>
            <VSCodeRadio value="standard">Stile standard</VSCodeRadio>
            <RadioDescription>Codice bilanciato tra comprensibilità e concisione</RadioDescription>
            
            <VSCodeRadio value="concise">Stile conciso</VSCodeRadio>
            <RadioDescription>Codice compatto e minimale</RadioDescription>
            
            <VSCodeRadio value="verbose">Stile dettagliato</VSCodeRadio>
            <RadioDescription>Codice ben commentato e documentato</RadioDescription>
          </VSCodeRadioGroup>
        </OptionGroup>
        
        <OptionDivider />
        
        <MultiAgentContainer>
          <OptionTitle>Funzionalità avanzate</OptionTitle>
          
          <VSCodeCheckbox checked={isMultiAgent} onChange={handleMultiAgentToggle}>
            <ToggleLabel>Collaborazione multi-agente</ToggleLabel>
            <ExperimentalTag>Sperimentale</ExperimentalTag>
          </VSCodeCheckbox>
          <RadioDescription>
            Utilizza più agenti specializzati che collaborano per compiti complessi: 
            uno per pianificare, uno per programmare, uno per testare.
          </RadioDescription>
        </MultiAgentContainer>
      </CoderOptionsSection>
    </ToggleContainer>
  );
}; 