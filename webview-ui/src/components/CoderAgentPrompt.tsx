import React, { useState, useEffect } from 'react';
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { AgentStatus, CodeStyle, PriorityLevel } from '../types/mas-types';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { 
  MasMessageType,
  SendCoderInstructionMessage,
  AbortCoderInstructionMessage,
  AgentMessageUnion
} from '@shared/messages';
import './CoderAgentPrompt.css';

interface CoderAgentPromptProps {
  agentStatus?: AgentStatus;
  onInstructionSent?: () => void;
}

/**
 * Componente per inviare istruzioni al CoderAgent
 * Implementa il pattern Union Dispatcher Type-Safe
 */
export const CoderAgentPrompt: React.FC<CoderAgentPromptProps> = ({
  agentStatus,
  onInstructionSent
}) => {
  const [instruction, setInstruction] = useState('');
  const [style, setStyle] = useState<CodeStyle>('standard');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [isLoading, setIsLoading] = useState(false);
  
  // Hook type-safe per la comunicazione con l'estensione
  const { postMessage } = useExtensionMessage();
  
  // Gestisce la sottomissione dell'istruzione
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instruction.trim()) {
      return;
    }
    
    setIsLoading(true);
    
    // Creazione del messaggio type-safe
    const message: SendCoderInstructionMessage = {
      type: MasMessageType.SEND_CODER_INSTRUCTION,
      payload: {
        instruction: instruction.trim(),
        style,
        priority
      }
    };
    
    // Invio del messaggio tramite il dispatcher type-safe
    postMessage<AgentMessageUnion>(message);
    
    // Reset del form dopo l'invio
    setInstruction('');
    
    // Notifica al parent che un'istruzione è stata inviata
    if (onInstructionSent) {
      onInstructionSent();
    }
    
    // Reimposta lo stato di caricamento dopo un breve ritardo
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  // Gestisce l'interruzione dell'istruzione corrente
  const handleAbort = () => {
    // Creazione del messaggio type-safe
    const message: AbortCoderInstructionMessage = {
      type: MasMessageType.ABORT_CODER_INSTRUCTION,
      payload: {}
    };
    
    // Invio del messaggio tramite il dispatcher type-safe
    postMessage<AgentMessageUnion>(message);
    
    // Notifica al parent che un'istruzione è stata inviata
    if (onInstructionSent) {
      onInstructionSent();
    }
  };
  
  return (
    <div className="coder-agent-prompt">
      <div className="prompt-header">
        <h3>Istruzione per CoderAgent</h3>
        <div className="agent-status">
          <span className={`status-indicator ${agentStatus?.isActive ? 'active' : 'inactive'}`}>
            {agentStatus?.isActive ? 'Attivo' : 'Inattivo'}
          </span>
        </div>
      </div>
      
      <form className="prompt-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <VSCodeTextField
            className="prompt-input"
            value={instruction}
            onChange={(e: any) => setInstruction(e.target.value)}
            placeholder="Inserisci un'istruzione per il CoderAgent..."
            disabled={isLoading || !agentStatus?.isActive}
          />
        </div>
        
        <div className="form-controls">
          <div className="control-group">
            <label>Stile di codice:</label>
            <VSCodeDropdown
              value={style}
              onChange={(e: any) => setStyle(e.target.value as CodeStyle)}
              disabled={isLoading || !agentStatus?.isActive}
            >
              <VSCodeOption value="standard">Standard</VSCodeOption>
              <VSCodeOption value="concise">Conciso</VSCodeOption>
              <VSCodeOption value="verbose">Dettagliato</VSCodeOption>
            </VSCodeDropdown>
          </div>
          
          <div className="control-group">
            <label>Priorità:</label>
            <VSCodeDropdown
              value={priority}
              onChange={(e: any) => setPriority(e.target.value as PriorityLevel)}
              disabled={isLoading || !agentStatus?.isActive}
            >
              <VSCodeOption value="high">Alta</VSCodeOption>
              <VSCodeOption value="normal">Normale</VSCodeOption>
              <VSCodeOption value="low">Bassa</VSCodeOption>
            </VSCodeDropdown>
          </div>
          
          <div className="button-group">
            <VSCodeButton
              type="submit"
              disabled={isLoading || !instruction.trim() || !agentStatus?.isActive}
            >
              {isLoading ? 'Inviando...' : 'Invia istruzione'}
            </VSCodeButton>
            
            <VSCodeButton
              type="button"
              appearance="secondary"
              onClick={handleAbort}
              disabled={!agentStatus?.isActive || !agentStatus?.currentTask}
            >
              Interrompi
            </VSCodeButton>
          </div>
        </div>
      </form>
      
      <div className="prompt-info">
        {agentStatus?.currentTask ? (
          <p className="current-task">
            <strong>Task corrente:</strong> {agentStatus.currentTask}
          </p>
        ) : (
          <p className="no-task">
            {agentStatus?.isActive 
              ? 'CoderAgent è in attesa di istruzioni'
              : 'CoderAgent non è attivo. Attivalo dalle impostazioni degli agenti.'}
          </p>
        )}
      </div>
    </div>
  );
}; 