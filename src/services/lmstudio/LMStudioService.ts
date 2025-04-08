import { vscode } from '../../../webview-ui/src/utils/vscode.js'

interface LMStudioResponse {
  response: string
  error?: string
}

export class LMStudioService {
  private static instance: LMStudioService
  private baseUrl: string = 'http://localhost:1234/v1'
  private isConnected: boolean = false

  private constructor() {}

  public static getInstance(): LMStudioService {
    if (!LMStudioService.instance) {
      LMStudioService.instance = new LMStudioService()
    }
    return LMStudioService.instance
  }

  public async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`)
      if (response.ok) {
        this.isConnected = true
        return true
      }
      return false
    } catch (error) {
      console.error('Errore di connessione a LM Studio:', error)
      return false
    }
  }

  public async sendPrompt(prompt: string): Promise<LMStudioResponse> {
    if (!this.isConnected) {
      const connected = await this.connect()
      if (!connected) {
        return {
          response: '',
          error: 'Impossibile connettersi a LM Studio. Assicurati che il servizio sia in esecuzione.'
        }
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'local-model',
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }

      const data = await response.json()
      return {
        response: data.choices[0].message.content
      }
    } catch (error) {
      console.error('Errore nell\'invio del prompt:', error)
      return {
        response: '',
        error: 'Errore durante l\'elaborazione del prompt. Riprova più tardi.'
      }
    }
  }
} 