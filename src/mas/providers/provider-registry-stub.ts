/**
 * @file provider-registry-stub.ts
 * @description Stub per i provider LLM nei test
 */

export class LLMProviderHandler {
  public id: string;
  public name: string;
  public isEnabled: boolean = true;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Gestisce una richiesta al provider LLM
   * @param payload Payload della richiesta
   * @returns Risultato della richiesta
   */
  public async handle(payload: unknown): Promise<unknown> {
    // Implementazione di base
    return { result: `Risposta dal provider ${this.name}` };
  }

  /**
   * Abilita il provider
   */
  public enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disabilita il provider
   */
  public disable(): void {
    this.isEnabled = false;
  }
}

/**
 * Registra i provider predefiniti
 * @returns Array di provider
 */
export function registerDefaultProviders(): LLMProviderHandler[] {
  return [
    new LLMProviderHandler('openai', 'OpenAI'),
    new LLMProviderHandler('anthropic', 'Anthropic'),
    new LLMProviderHandler('mistral', 'Mistral')
  ];
} 