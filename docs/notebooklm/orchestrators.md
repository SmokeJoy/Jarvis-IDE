# Orchestratori del Multi-Agent System - Jarvis IDE

## Panoramica

Questo notebook descrive gli orchestratori implementati nel sistema Multi-Agent di Jarvis IDE. Gli orchestratori sono componenti di alto livello che coordinano le attività tra agenti e gestiscono i flussi di lavoro complessi.

## Command Center

Il Command Center è il nucleo centrale del sistema MAS, responsabile dell'instradamento dei messaggi e del mantenimento dello stato globale del sistema.

### Responsabilità principali:
- Registrazione e gestione del ciclo di vita degli agenti
- Instradamento dei comandi tra gli agenti
- Monitoraggio dello stato di salute degli agenti tramite heartbeat
- Gestione degli eventi di sistema

### Interfaccia:
```typescript
class CommandCenter {
  registerAgent(agent: AgentInfo): string;
  updateAgentStatus(agentId: string, status: AgentStatus): boolean;
  updateAgentHeartbeat(agentId: string): boolean;
  sendCommand(command: CommandInfo): string;
  on(event: string, handler: Function): void;
  removeAgent(agentId: string): boolean;
}
```

## Coordinator Agent

L'agente Coordinator è responsabile della gestione dei task e del coordinamento dei flussi di lavoro.

### Responsabilità principali:
- Creazione e gestione dei task
- Scomposizione dei task in subtask
- Assegnazione di subtask agli agenti appropriati
- Monitoraggio dell'avanzamento dei task
- Sincronizzazione dei risultati

### Workflow tipico:
1. Ricezione di una richiesta di creazione di task
2. Pianificazione del task (scomposizione in subtask)
3. Assegnazione di subtask agli agenti specializzati
4. Monitoraggio dello stato delle subtask
5. Aggregazione dei risultati delle subtask
6. Notifica del completamento del task

## Flusso di orchestrazione

```
[Command Center]
      ^  |
      |  v
[Coordinator Agent]
   /    |    \
  v     v     v
[Analyst] [Executor] [Altri agenti]
```

## Eventi di sistema

Gli orchestratori utilizzano un sistema di eventi per comunicare tra loro:

1. **Eventi degli agenti**:
   - `agent:registered` - Un nuovo agente è stato registrato
   - `agent:removed` - Un agente è stato rimosso
   - `agent:status-changed` - Lo stato di un agente è cambiato
   - `agent:offline` - Un agente è diventato offline

2. **Eventi dei comandi**:
   - `command:sent` - Un comando è stato inviato
   - `command:<agentId>` - Un comando specifico per un agente

3. **Eventi dei task**:
   - `task-created` - Un nuovo task è stato creato
   - `task-started` - Un task è stato avviato
   - `task-updated` - Lo stato di un task è stato aggiornato
   - `task-completed` - Un task è stato completato
   - `task-failed` - Un task è fallito

4. **Eventi di sistema**:
   - `system:heartbeat` - Heartbeat periodico del sistema
   - `error` - Notifica di errore

## Vantaggi dell'orchestrazione

1. **Disaccoppiamento**: Gli agenti non hanno bisogno di conoscersi direttamente
2. **Flessibilità**: Nuovi agenti possono essere aggiunti senza modificare gli esistenti
3. **Robustezza**: Il sistema può continuare a funzionare anche se alcuni agenti falliscono
4. **Scalabilità**: Distribuzione del carico di lavoro tra più agenti

## Implementazione degli orchestratori

Gli orchestratori sono implementati come componenti singleton, accessibili da qualsiasi parte dell'applicazione. Utilizzano un pattern di messaggistica basato su eventi per comunicare in modo asincrono.

Il Command Center implementa il pattern Mediator, fungendo da intermediario tra tutti gli agenti del sistema. Questo riduce le dipendenze dirette tra agenti e semplifica la comunicazione.

## Esempi di comandi:

**Creazione di un task**:
```typescript
commandCenter.sendCommand({
  type: 'create-task',
  payload: {
    title: 'Analizza il progetto',
    description: 'Analizza il codice del progetto e identifica problemi',
    requestId: 'req-123'
  },
  source: 'extension',
  target: '',  // Broadcast
  priority: 1
});
```

**Esecuzione di un'analisi**:
```typescript
commandCenter.sendCommand({
  type: 'analyze',
  payload: {
    type: 'project',
    requestId: 'analysis-123'
  },
  source: 'coordinator',
  target: 'analyst',
  priority: 2
});
```

---

*Notebook creato da: AI1 | Jarvis MAS v1.0.0 Init* 