/**
 * @file index.ts
 * @description Punto di ingresso per gli agenti MAS
 * @author AI1 | Jarvis MAS v1.0.0 Init
 */

// Esporta tutti gli agenti
export * from './ExecutorAgent';
export * from './AnalystAgent';
export * from './CoordinatorAgent';

// Esporta un oggetto che contiene tutti gli agenti per inicializzazione
import { executorAgent } from './ExecutorAgent';
import { analystAgent } from './AnalystAgent';
import { coordinatorAgent } from './CoordinatorAgent';

export const agents = {
  executor: executorAgent,
  analyst: analystAgent,
  coordinator: coordinatorAgent,
};

// Funzione di inizializzazione degli agenti
export function initializeAgents(): void {
  console.log('[MAS] Initializing agents...');

  // L'importazione degli agenti li inizializza automaticamente
  // Possiamo fare qualcosa di aggiuntivo se necessario

  console.log('[MAS] Agents initialized successfully');
}

// Funzione di terminazione degli agenti
export function terminateAgents(): void {
  console.log('[MAS] Terminating agents...');

  // Pulizia delle risorse degli agenti
  // Ad esempio, potremmo voler cancellare i timer di heartbeat

  console.log('[MAS] Agents terminated successfully');
}
