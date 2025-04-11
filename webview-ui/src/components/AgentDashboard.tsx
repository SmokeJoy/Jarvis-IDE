/**
 * @file AgentDashboard.tsx
 * @description Dashboard per visualizzare lo stato di un agente, la sua memoria e offrire funzionalità di retry
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, List, ListItem, ListItemText, Divider, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import MemoryIcon from '@mui/icons-material/Memory';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useAgentMemory } from '../hooks/useAgentMemory';
import { useExtensionMessage } from '../hooks/useExtensionMessage';
import { MasMessageType, AgentToggleRequestMessage, AgentMessageUnion } from '../types/mas-message';
import { AgentStatus, AgentMode } from '../types/mas-types';
import { formatRelativeTime } from '../utils/date-utils';

/**
 * Proprietà per il componente AgentDashboard
 */
interface AgentDashboardProps {
  agent: AgentStatus;
  showMemory?: boolean;
}

/**
 * Componente che mostra lo stato di un agente e permette di gestirlo
 * Implementa il pattern Union Dispatcher Type-Safe
 */
export const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
  agent,
  showMemory: initialShowMemory = false
}) => {
  // State locale per mostrare/nascondere la memoria
  const [showMemory, setShowMemory] = useState<boolean>(initialShowMemory);
  
  // Otteniamo la memoria dell'agente usando l'hook type-safe
  const { 
    memory, 
    isLoading, 
    retryTask, 
    retryStatus, 
    loadMemory 
  } = useAgentMemory({ 
    agentId: agent.id, 
    autoLoad: showMemory 
  });
  
  // Hook per la comunicazione type-safe con l'estensione
  const { postMessage } = useExtensionMessage();
  
  /**
   * Gestisce l'attivazione/disattivazione dell'agente
   */
  const handleToggleAgent = useCallback(() => {
    // Creazione del messaggio type-safe
    const message: AgentToggleRequestMessage = {
      type: MasMessageType.AGENT_TOGGLE_REQUEST,
      payload: {
        agentId: agent.id,
        active: !agent.active
      }
    };
    
    // Invio del messaggio tramite il dispatcher type-safe
    postMessage<AgentMessageUnion>(message);
  }, [agent.id, agent.active, postMessage]);
  
  /**
   * Gestisce il retry di un task
   */
  const handleRetry = useCallback((taskId: string) => {
    retryTask(taskId);
  }, [retryTask]);
  
  /**
   * Determina il colore dello stato dell'agente
   */
  const getStatusColor = useCallback(() => {
    if (!agent.active) return 'text.disabled';
    if (agent.mode === AgentMode.BUSY) return 'warning.main';
    return 'success.main';
  }, [agent.active, agent.mode]);
  
  /**
   * Determina il testo dello stato dell'agente
   */
  const getStatusText = useCallback(() => {
    if (!agent.active) return 'Inattivo';
    if (agent.mode === AgentMode.BUSY) return 'Occupato';
    return 'Disponibile';
  }, [agent.active, agent.mode]);
  
  /**
   * Rendering di un elemento di memoria
   */
  const renderMemoryItem = useCallback((item, index) => {
    const taskId = item.task?.id;
    const retryState = retryStatus[taskId];
    const isRetrying = retryState?.inProgress;
    const retrySuccess = retryState?.success;
    const retryError = retryState?.error;
    const retryResult = retryState?.result;
    
    return (
      <ListItem 
        key={`${item.id}-${index}`}
        sx={{ 
          flexDirection: 'column', 
          alignItems: 'flex-start',
          backgroundColor: retrySuccess 
            ? alpha('#e6f4ea', 0.5)
            : retryError 
              ? alpha('#fce8e6', 0.5)
              : 'transparent',
          mb: 1,
          borderRadius: 1
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ListItemText
            primary={item.task?.description || 'Attività sconosciuta'}
            secondary={`${formatRelativeTime(item.timestamp)}`}
            primaryTypographyProps={{ 
              fontWeight: 'medium',
              variant: 'body2'
            }}
            secondaryTypographyProps={{ 
              variant: 'caption',
              color: 'text.secondary'
            }}
          />
          
          <Box>
            <Chip 
              size="small" 
              label={item.status} 
              color={
                item.status === 'completed' ? 'success' :
                item.status === 'failed' ? 'error' :
                'default'
              }
              sx={{ mr: 1 }}
            />
            
            {item.status === 'failed' && (
              <Tooltip title="Riprova questa attività">
                <IconButton 
                  size="small" 
                  onClick={() => handleRetry(taskId)}
                  disabled={isRetrying}
                  color="primary"
                >
                  {isRetrying ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {/* Mostra i risultati del retry se disponibili */}
        {(retrySuccess || retryError) && (
          <Box 
            sx={{ 
              mt: 1, 
              p: 1, 
              width: '100%',
              fontSize: '0.875rem',
              borderRadius: 1,
              backgroundColor: alpha(
                retrySuccess ? '#e6f4ea' : '#fce8e6', 
                0.8
              ),
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {retrySuccess ? (
              <CheckCircleIcon 
                fontSize="small" 
                color="success" 
                sx={{ mr: 1 }}
              />
            ) : (
              <ErrorIcon 
                fontSize="small" 
                color="error" 
                sx={{ mr: 1 }}
              />
            )}
            <Typography variant="body2">
              {retrySuccess 
                ? "Retry completato con successo" 
                : `Errore: ${retryError}`
              }
            </Typography>
          </Box>
        )}
      </ListItem>
    );
  }, [retryStatus, handleRetry]);

  return (
    <Card 
      elevation={2}
      sx={{ 
        mb: 2,
        borderLeft: 3,
        borderColor: getStatusColor()
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {agent.name}
            </Typography>
            <Chip 
              label={getStatusText()} 
              size="small"
              sx={{ 
                ml: 2, 
                backgroundColor: alpha(getStatusColor(), 0.1),
                color: getStatusColor(),
                fontWeight: 'medium'
              }}
            />
          </Box>
          
          <Tooltip title={agent.active ? "Disattiva agente" : "Attiva agente"}>
            <IconButton 
              onClick={handleToggleAgent}
              color={agent.active ? "primary" : "default"}
            >
              <PowerSettingsNewIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {agent.description || "Nessuna descrizione disponibile"}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1 }}>
        <Box>
          <Chip 
            size="small" 
            label={`Modalità: ${agent.mode}`}
            color="info"
            variant="outlined"
          />
        </Box>
        
        <Button
          size="small"
          startIcon={showMemory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          endIcon={<MemoryIcon />}
          onClick={() => {
            setShowMemory(!showMemory);
            if (!showMemory) {
              loadMemory();
            }
          }}
        >
          {showMemory ? "Nascondi memoria" : "Mostra memoria"}
        </Button>
      </CardActions>
      
      {showMemory && (
        <>
          <Divider />
          <CardContent sx={{ pt: 1, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Memoria dell'agente
              </Typography>
              
              <Tooltip title="Aggiorna memoria">
                <IconButton 
                  size="small" 
                  onClick={() => loadMemory()}
                  disabled={isLoading}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : memory.length > 0 ? (
              <List dense sx={{ p: 0 }}>
                {memory.map(renderMemoryItem)}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Nessuna memoria disponibile per questo agente
              </Typography>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}; 