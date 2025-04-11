/**
 * @file setup-msw.ts
 * @description Setup e configurazione Mock Service Worker per test API
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/api-handlers';

// Inizializza il server MSW con gli handler
export const server = setupServer(...handlers);

// Handlers extra per test specifici
export const extraHandlers = {
  // Simulazione error 500
  serverError: http.all('*', () => {
    return HttpResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }),
  
  // Simulazione network error
  networkError: http.all('*', () => {
    return HttpResponse.error();
  }),
  
  // Simulazione risposta lenta
  slowResponse: http.all('*', async ({ request }) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return HttpResponse.next();
  })
};

/**
 * Configura MSW per tutti i test
 * Può essere importato da setupFiles in vitest.config.ts
 */
beforeAll(() => {
  // Avvia il server MSW prima di tutti i test
  server.listen({ onUnhandledRequest: 'warn' });
  console.log('🔶 MSW server avviato');
});

/**
 * Reset delle mock dopo ogni test
 */
afterEach(() => {
  // Resetta gli handler a quelli predefiniti
  server.resetHandlers();
});

/**
 * Chiusura del server MSW dopo tutti i test
 */
afterAll(() => {
  // Interrompi il server MSW dopo tutti i test
  server.close();
  console.log('🔶 MSW server fermato');
});

/**
 * Utility per mockare una risposta API specifica per un singolo test
 * @example
 * // In un test:
 * mockApi('get', 'https://api.jarvis-ide.com/llm/models', { models: [] });
 */
export function mockApi(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  responseData: any,
  status: number = 200
): void {
  const httpMethod = http[method];
  server.use(
    httpMethod(url, () => {
      return HttpResponse.json(responseData, { status });
    })
  );
}

/**
 * Utility per mockare un errore API specifico
 */
export function mockApiError(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  errorMsg: string = 'Errore API',
  status: number = 400
): void {
  const httpMethod = http[method];
  server.use(
    httpMethod(url, () => {
      return HttpResponse.json({ error: errorMsg }, { status });
    })
  );
}

/**
 * Utility per attivare uno degli handler extra predefiniti
 * @example
 * // In un test:
 * useExtraHandler('serverError');
 */
export function useExtraHandler(handlerName: keyof typeof extraHandlers): void {
  server.use(extraHandlers[handlerName]);
} 