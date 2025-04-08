import React, { useState, useEffect } from 'react';
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { MasCommunicationService } from '../services/MasCommunicationService';
import { AgentStatus, CodeStyle, PriorityLevel } from '../types/mas-types';
import './CoderAgentPrompt.css';

interface CoderAgentPromptProps {
  agentStatus?: AgentStatus;
  onInstructionSent?: () => void;
}

/**
 * Componente per inviare istruzioni al CoderAgent
 */
export const CoderAgentPrompt: React.FC<CoderAgentPromptProps> = ({ 
  agentStatus,
  onInstructionSent 
}) => {
  const [instruction, setInstruction] = useState<string>('');
  const [style, setStyle] = useState<CodeStyle>('standard');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const masService = MasCommunicationService.getInstance();
  
  // Effetto per gestire i messaggi dal backend
  useEffect(() => {
    const handleInstructionReceived = (data: any) => {
      setIsSending(false);
      setStatusMessage('Istruzione ricevuta dal CoderAgent');
      
      // Resetta il messaggio di stato dopo 3 secondi
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      
      if (onInstructionSent) {
        onInstructionSent();
      }
    };
    
    const handleInstructionFailed = (data: any) => {
      setIsSending(false);
      setStatusMessage(`Errore: ${data.error || 'Invio istruzione fallito'}`);
    };
    
    // Sottoscrizione agli eventi di risposta
    masService.subscribe('instructionReceived', handleInstructionReceived);
    masService.subscribe('instructionFailed', handleInstructionFailed);
    
    return () => {
      // Pulizia delle sottoscrizioni
      masService.unsubscribe('instructionReceived', handleInstructionReceived);
      masService.unsubscribe('instructionFailed', handleInstructionFailed);
    };
  }, [masService, onInstructionSent]);
  
  /**
   * Gestisce l'invio dell'istruzione
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instruction.trim()) {
      setStatusMessage('L\'istruzione non può essere vuota');
      return;
    }
    
    setIsSending(true);
    setStatusMessage('Invio istruzione in corso...');
    
    // Invia l'istruzione tramite il servizio di comunicazione
    masService.sendCoderInstruction(instruction, style, priority);
  };
  
  /**
   * Annulla l'istruzione corrente
   */
  const handleAbort = () => {
    masService.abortCurrentCoderInstruction();
    setStatusMessage('Richiesta di annullamento inviata');
  };
  
  return (
    <div className="coder-agent-prompt">
      <div className="prompt-header">
        <h3>Invia istruzioni al CoderAgent</h3>
        {agentStatus && (
          <div className={`agent-status ${agentStatus.isActive ? 'active' : 'inactive'}`}>
            {agentStatus.isActive ? 'Agente attivo' : 'Agente inattivo'}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="prompt-form">
        <VSCodeTextField
          value={instruction}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstruction(e.target.value)}
          placeholder="Scrivi un'istruzione per il CoderAgent..."
          multiline
          rows={5}
          disabled={isSending || (agentStatus && !agentStatus.isActive)}
          className="instruction-input"
        />
        
        <div className="prompt-controls">
          <div className="prompt-options">
            <label>Stile:</label>
            <VSCodeDropdown
              value={style}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                setStyle(e.target.value as CodeStyle)}
              disabled={isSending || (agentStatus && !agentStatus.isActive)}
            >
              <VSCodeOption value="standard">Standard</VSCodeOption>
              <VSCodeOption value="concise">Conciso</VSCodeOption>
              <VSCodeOption value="verbose">Dettagliato</VSCodeOption>
            </VSCodeDropdown>
            
            <label>Priorità:</label>
            <VSCodeDropdown
              value={priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                setPriority(e.target.value as PriorityLevel)}
              disabled={isSending || (agentStatus && !agentStatus.isActive)}
            >
              <VSCodeOption value="low">Bassa</VSCodeOption>
              <VSCodeOption value="normal">Normale</VSCodeOption>
              <VSCodeOption value="high">Alta</VSCodeOption>
            </VSCodeDropdown>
          </div>
          
          <div className="prompt-actions">
            <VSCodeButton
              type="submit"
              disabled={!instruction.trim() || isSending || (agentStatus && !agentStatus.isActive)}
            >
              {isSending ? 'Invio in corso...' : 'Invia istruzione'}
            </VSCodeButton>
            
            {agentStatus?.currentTask && (
              <VSCodeButton
                appearance="secondary"
                onClick={handleAbort}
                disabled={isSending || (agentStatus && !agentStatus.isActive)}
              >
                Annulla operazione
              </VSCodeButton>
            )}
          </div>
        </div>
        
        {statusMessage && (
          <div className={`status-message ${statusMessage.includes('Errore') ? 'error' : 'info'}`}>
            {statusMessage}
          </div>
        )}
      </form>
      
      {/* Suggerimenti per prompt comuni */}
      <div className="prompt-templates">
        <h4>Template di istruzioni:</h4>
        <div className="template-list">
          <button 
            className="template-item"
            onClick={() => setInstruction('Crea una nuova classe per gestire...')}
            disabled={isSending || (agentStatus && !agentStatus.isActive)}
          >
            Crea una nuova classe
          </button>
          <button 
            className="template-item"
            onClick={() => setInstruction('Rifattorizza il seguente metodo per migliorare...')}
            disabled={isSending || (agentStatus && !agentStatus.isActive)}
          >
            Rifattorizza metodo
          </button>
          <button 
            className="template-item"
            onClick={() => setInstruction('Implementa dei test per la classe...')}
            disabled={isSending || (agentStatus && !agentStatus.isActive)}
          >
            Crea tests
          </button>
          <button 
            className="template-item"
            onClick={() => setInstruction('Documenta la funzione seguendo lo standard JSDoc...')}
            disabled={isSending || (agentStatus && !agentStatus.isActive)}
          >
            Aggiungi documentazione
          </button>
        </div>
      </div>
    </div>
  );
}; 