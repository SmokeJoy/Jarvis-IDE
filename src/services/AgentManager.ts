import * as fs from 'fs';
import * as path from 'path';
import { sendPrompt } from './LMStudioService';
import { runPython } from './pythonBridge';

// Interfaccia per definire la struttura di un agente
export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  capabilities: string[];
  memoryContext?: string;
}

// Interfaccia per la risposta dell'agente
export interface AgentResponse {
  success: boolean;
  content: string;
  error?: string;
  metadata?: {
    type: string;
    timestamp: number;
    agentId: string;
  };
}

// Classe principale per gestire gli agenti
export class AgentManager {
  private agents: Map<string, Agent>;
  private activeAgent: string | null;
  private memoryPath: string;

  constructor() {
    this.agents = new Map();
    this.activeAgent = null;
    this.memoryPath = path.join(__dirname, '../../memory');
    this.initializeAgents();
  }

  private initializeAgents() {
    // Developer Agent - Genera codice e risponde ai prompt
    this.registerAgent({
      id: 'developer',
      name: 'Developer Agent',
      description: 'Genera codice C# e risponde ai prompt di sviluppo',
      role: 'developer',
      capabilities: ['generazione codice C#', 'debugging', 'refactoring', 'ottimizzazione'],
      memoryContext: 'developer_context.json',
    });

    // Compiler Agent - Gestisce la compilazione
    this.registerAgent({
      id: 'compiler',
      name: 'Compiler Agent',
      description: 'Gestisce la compilazione e la verifica del codice',
      role: 'compiler',
      capabilities: [
        'compilazione progetto',
        'verifica errori',
        'analisi dipendenze',
        'ottimizzazione build',
      ],
      memoryContext: 'compiler_context.json',
    });

    // Memory Agent - Gestisce il contesto e la memoria
    this.registerAgent({
      id: 'memory',
      name: 'Memory Agent',
      description: 'Recupera e gestisce la documentazione e il contesto',
      role: 'memory',
      capabilities: [
        'ricerca documentazione',
        'gestione contesto',
        'analisi progetti passati',
        'suggerimenti contestuali',
      ],
      memoryContext: 'memory_context.json',
    });

    // Doc Agent - Gestisce la documentazione
    this.registerAgent({
      id: 'doc',
      name: 'Documentation Agent',
      description: 'Analizza e genera documentazione per il codice',
      role: 'documentation',
      capabilities: [
        'analisi file .cs',
        'generazione documentazione',
        'commenti automatici',
        'manuali utente',
      ],
      memoryContext: 'doc_context.json',
    });
  }

  public registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  public setActiveAgent(agentId: string): boolean {
    if (this.agents.has(agentId)) {
      this.activeAgent = agentId;
      return true;
    }
    return false;
  }

  public getActiveAgent(): Agent | null {
    return this.activeAgent ? this.agents.get(this.activeAgent) || null : null;
  }

  public async processPrompt(prompt: string): Promise<AgentResponse> {
    const agent = this.getActiveAgent();
    if (!agent) {
      return {
        success: false,
        content: '',
        error: 'Nessun agente attivo selezionato',
      };
    }

    try {
      // Carica il contesto di memoria specifico dell'agente
      const memoryContext = await this.loadMemoryContext(agent.memoryContext);

      // Elabora il prompt in base al ruolo dell'agente
      const response = await this.processAgentPrompt(agent, prompt, memoryContext);

      return {
        success: true,
        content: response,
        metadata: {
          type: agent.role,
          timestamp: Date.now(),
          agentId: agent.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `Errore nell'elaborazione del prompt: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async loadMemoryContext(contextFile: string | undefined): Promise<any> {
    if (!contextFile) return null;

    const contextPath = path.join(this.memoryPath, contextFile);
    try {
      if (fs.existsSync(contextPath)) {
        return JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
      }
    } catch (error) {
      console.error(
        `❌ Errore nel caricamento del contesto: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return null;
  }

  private async processAgentPrompt(agent: Agent, prompt: string, context: any): Promise<string> {
    // Implementazione specifica per ogni tipo di agente
    switch (agent.role) {
      case 'developer':
        return this.processDeveloperPrompt(prompt, context);
      case 'compiler':
        return this.processCompilerPrompt(prompt, context);
      case 'memory':
        return this.processMemoryPrompt(prompt, context);
      case 'documentation':
        return this.processDocPrompt(prompt, context);
      default:
        throw new Error(`Ruolo agente non supportato: ${agent.role}`);
    }
  }

  private async processDeveloperPrompt(prompt: string, context: any): Promise<string> {
    try {
      // Carica la configurazione
      const config = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../config/config.json'), 'utf-8')
      );

      // Verifica la lunghezza del prompt
      if (prompt.length > 12000) {
        return `⚠️ **Warning: Prompt troppo lungo**\n\nIl prompt supera il limite di 12000 caratteri. Per favore, riduci la lunghezza del prompt per evitare problemi di token.`;
      }

      // Prepara il prompt finale
      let finalPrompt = '';

      // Aggiunge il contesto se presente
      if (context?.context) {
        finalPrompt += `${context.context}\n\n`;
      }

      // Aggiunge la documentazione se attiva
      if (config.documentation?.enabled && context?.documentation) {
        finalPrompt += `${context.documentation}\n\n`;
      }

      // Aggiunge il prompt dell'utente
      finalPrompt += prompt;

      // Se coder_mode è attivo, usa il prompt così com'è
      if (config.coder_mode) {
        return await sendPrompt(finalPrompt);
      }

      // Altrimenti, aggiungi le istruzioni standard
      return await sendPrompt(`Sei un assistente AI esperto in sviluppo C#. ${finalPrompt}`);
    } catch (error) {
      return `❌ **Errore nell'elaborazione del prompt:**\n\`\`\`\n${
        error instanceof Error ? error.message : String(error)
      }\n\`\`\``;
    }
  }

  private async processCompilerPrompt(prompt: string, context: any): Promise<string> {
    try {
      // Esegue il comando di build
      const output = await runPython(path.join(__dirname, '../../scripts/dotnet_build.py'));

      // Analizza l'output per determinare il risultato
      const success = output.includes('Build succeeded');
      const errors = output.match(/error CS\d+:.*/g) || [];
      const warnings = output.match(/warning CS\d+:.*/g) || [];

      // Formatta la risposta in modo chiaro e strutturato
      let response = `## 📦 Risultato Compilazione\n\n`;

      if (success) {
        response += `✅ **Build completata con successo!**\n\n`;
      } else {
        response += `❌ **Build fallita!**\n\n`;
      }

      if (warnings.length > 0) {
        response += `### ⚠️ Warning (${warnings.length})\n`;
        warnings.forEach((warning: string) => {
          response += `- ${warning}\n`;
        });
        response += '\n';
      }

      if (errors.length > 0) {
        response += `### ❌ Errori (${errors.length})\n`;
        errors.forEach((error: string) => {
          response += `- ${error}\n`;
        });
        response += '\n';
      }

      // Aggiunge il log completo per debug
      response += `### 📝 Log Completo\n\`\`\`\n${output}\n\`\`\``;

      return response;
    } catch (error) {
      return `❌ **Errore durante la compilazione:**\n\`\`\`\n${
        error instanceof Error ? error.message : String(error)
      }\n\`\`\``;
    }
  }

  private async processMemoryPrompt(prompt: string, context: any): Promise<string> {
    // Implementazione per l'agente memoria
    return `[Memory Agent] Elaborazione del prompt: ${prompt}`;
  }

  private async processDocPrompt(prompt: string, context: any): Promise<string> {
    // Implementazione per l'agente documentazione
    return `[Doc Agent] Elaborazione del prompt: ${prompt}`;
  }
}
