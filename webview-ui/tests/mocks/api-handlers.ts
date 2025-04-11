/**
 * @file api-handlers.ts
 * @description Mock Service Worker handlers per simulare API REST
 */

import { http, HttpResponse } from 'msw';

// Costanti
const API_BASE_URL = 'https://api.jarvis-ide.com';
const LLM_API_URL = `${API_BASE_URL}/llm`;
const AGENT_API_URL = `${API_BASE_URL}/agent`;

/**
 * Handlers per API LLM
 */
const llmHandlers = [
  // Endpoint di completamento
  http.post(`${LLM_API_URL}/complete`, async ({ request }) => {
    try {
      const body = await request.json();
      const { prompt, provider = 'openai', model = 'gpt-4' } = body;
      
      return HttpResponse.json({
        text: `Risposta simulata per: ${prompt.substring(0, 50)}...`,
        provider,
        model,
        usage: {
          prompt_tokens: prompt.length / 4,
          completion_tokens: 150,
          total_tokens: prompt.length / 4 + 150
        },
        metrics: {
          latency_ms: 450,
          first_token_ms: 120
        }
      }, { status: 200 });
    } catch (error) {
      return HttpResponse.json({ 
        error: "Errore nel processare la richiesta" 
      }, { status: 400 });
    }
  }),
  
  // Endpoint modelli disponibili
  http.get(`${LLM_API_URL}/models`, ({ request }) => {
    // Estrai provider da URL params
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') || 'openai';
    
    const mockModels = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
      ],
      anthropic: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' }
      ],
      ollama: [
        { id: 'llama3', name: 'Llama 3', provider: 'ollama' },
        { id: 'mistral', name: 'Mistral', provider: 'ollama' }
      ]
    };
    
    return HttpResponse.json(mockModels[provider] || [], { status: 200 });
  }),
  
  // Endpoint di stato provider
  http.get(`${LLM_API_URL}/providers/status`, () => {
    return HttpResponse.json({
      openai: { available: true, latency: 120 },
      anthropic: { available: true, latency: 180 },
      ollama: { available: true, latency: 20 },
      mistral: { available: false, error: "API key non configurata" }
    }, { status: 200 });
  })
];

/**
 * Handlers per API agenti
 */
const agentHandlers = [
  // Endpoint di esecuzione agente
  http.post(`${AGENT_API_URL}/execute`, async ({ request }) => {
    try {
      const body = await request.json();
      const { agentId, input } = body;
      
      // Ritardo simulato
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return HttpResponse.json({
        agentId,
        output: {
          thought: `Penso a come rispondere a: ${input.query}`,
          message: `Ecco la risposta dell'agente ${agentId} alla query`,
          context: { ...input, result: "Dati elaborati dall'agente" }
        },
        executionTime: 450
      }, { status: 200 });
    } catch (error) {
      return HttpResponse.json({ 
        error: "Errore nell'esecuzione dell'agente" 
      }, { status: 500 });
    }
  }),
  
  // Endpoint di stato agenti
  http.get(`${AGENT_API_URL}/status`, () => {
    return HttpResponse.json({
      planner: { status: 'ready', lastExecution: new Date().toISOString() },
      researcher: { status: 'ready', lastExecution: new Date().toISOString() },
      writer: { status: 'busy', currentTask: 'Elaborazione risposta' }
    }, { status: 200 });
  }),
  
  // Endpoint per ottenere la lista degli agenti disponibili
  http.get(`${AGENT_API_URL}/list`, () => {
    return HttpResponse.json([
      { id: 'planner', role: 'planner', description: 'Agente di pianificazione' },
      { id: 'researcher', role: 'researcher', description: 'Agente di ricerca' },
      { id: 'analyzer', role: 'analyzer', description: 'Agente di analisi' },
      { id: 'writer', role: 'writer', description: 'Agente di scrittura' },
      { id: 'critic', role: 'critic', description: 'Agente di revisione' }
    ], { status: 200 });
  })
];

/**
 * Handler per errori di autenticazione
 */
const authHandlers = [
  // Intercetta richieste con token mancante o invalido
  http.all('*', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ 
        error: "Autenticazione richiesta" 
      }, { status: 401 });
    }
    
    // Simula token scaduto
    if (authHeader === 'Bearer EXPIRED_TOKEN') {
      return HttpResponse.json({ 
        error: "Token scaduto" 
      }, { status: 401 });
    }
    
    // Continua con il flusso normale per token validi
    return HttpResponse.next();
  })
];

// Esporta tutti gli handler
export const handlers = [
  ...llmHandlers,
  ...agentHandlers,
  ...authHandlers
]; 