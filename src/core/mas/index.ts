/**
 * Sistema Multi-Agent per Jarvis-IDE
 *
 * Questo modulo implementa un sistema multi-agente (MAS) che coordina diversi agenti
 * specializzati per diverse funzioni di sviluppo del software.
 *
 * Il sistema è progettato con un approccio centralizzato, dove il SupervisorAgent
 * coordina gli altri agenti e rappresenta il principale punto di contatto con l'esterno.
 */

// Esporta i tipi
export * from './AgentTypes';

// Esporta gli agenti
export { SupervisorAgent } from './SupervisorAgent';
export { CoderAgent } from './CoderAgent';

/**
 * Crea e inizializza un'istanza del sistema MAS
 * @returns L'agente supervisore che coordina il sistema
 */
export function createMasSystem() {
  const { SupervisorAgent } = require('./SupervisorAgent');
  const { CoderAgent } = require('./CoderAgent');

  // Crea gli agenti
  const supervisorAgent = new SupervisorAgent();
  const coderAgent = new CoderAgent();

  // Registra gli agenti nel supervisore
  supervisorAgent.registerAgents(coderAgent);

  // Configura l'ascolto dei messaggi
  supervisorAgent.on('message', (message: any) => {
    if (message.to === 'coder-agent') {
      coderAgent.handleMessage(message);
    }
  });

  return supervisorAgent;
}
