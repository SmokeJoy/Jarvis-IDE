import { DeepSeekHandler } from "./deepseek.js"
import { createMockStream } from "../transform/stream.js"
import { expect } from "chai"
import { describe, it } from "mocha"
import { ApiHandlerOptions } from "../../shared/types/api.types.js"
import { ApiStreamChunk } from "../transform/stream.js"
import { DeepSeekModelId } from "../../shared/api.js"
import { Anthropic } from "@anthropic-ai/sdk"

// Creiamo una versione più semplice della classe di test che evita tipi specifici di OpenAI
class TestDeepSeekHandler extends DeepSeekHandler {
	// Override dei metodi protetti per i test
	protected override async fetchAPIResponse(systemPrompt: string, messages: any[]): Promise<any> {
		// Memorizza i messaggi per l'analisi nel test
		this.capturedMessages = messages
		
		// Se è stato impostato uno stream mockato, lo restituisce
		if (this.mockStream) return this.mockStream
		
		// Altrimenti usa l'implementazione originale
		return super.fetchAPIResponse(systemPrompt, messages)
	}
	
	// Metodi pubblici per il testing
	public setMockStream(stream: any): void {
		this.mockStream = stream
	}
	
	public getCapturedMessages(): any[] | undefined {
		return this.capturedMessages
	}
	
	// Override di getStream per intercettare errori test retry
	public async getStream(systemPrompt: string, messages: any[]): Promise<any> {
		if (this.errorOnFirstAttempt && !this.hasAttempted) {
			this.hasAttempted = true
			throw new Error("Errore simulato al primo tentativo")
		}
		
		// Se è stato impostato uno stream mockato, lo restituisce
		if (this.mockStream) return this.mockStream
		
		// Altrimenti usa l'implementazione originale
		return super.getStream(systemPrompt, messages)
	}
	
	public simulateErrorOnFirstAttempt(): void {
		this.errorOnFirstAttempt = true
		this.hasAttempted = false
	}
	
	// Proprietà private per il testing
	private mockStream?: any
	private capturedMessages?: any[]
	private errorOnFirstAttempt = false
	private hasAttempted = false
}

// Helper per creare l'handler di test
function createTestHandler(modelId: DeepSeekModelId): TestDeepSeekHandler {
	const handler = new TestDeepSeekHandler({
		apiModelId: modelId,
		deepSeekApiKey: "test-api-key",
	} as any)
	
	// Override di getModel per ritornare un modello di test
	handler.getModel = () => ({
		id: modelId,
		info: {
			context_length: 4096,
			pricing: { prompt: 0.0001, completion: 0.0002 },
			maxTokens: 1024,
			supportsPromptCache: true,
		},
	})
	
	return handler
}

describe("DeepSeekHandler", () => {
	it("✅ should yield text chunks", async () => {
		// Prepara
		const handler = createTestHandler("deepseek-chat")
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: "Ciao" } }] },
			{ choices: [{ delta: { content: " mondo!" } }] },
		]))
		
		// Esegui
		const result: ApiStreamChunk[] = []
		for await (const chunk of handler.createMessage("prompt", [])) {
			result.push(chunk)
		}
		
		// Verifica
		expect(result).to.deep.include.members([
			{ type: "text", text: "Ciao" },
			{ type: "text", text: " mondo!" },
		])
	})

	it("✅ should yield reasoning chunks (deepseek-reasoner)", async () => {
		// Prepara
		const handler = createTestHandler("deepseek-reasoner")
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { reasoning_content: "Spiegazione logica" } }] }
		]))
		
		// Esegui
		const result: ApiStreamChunk[] = []
		for await (const chunk of handler.createMessage("prompt", [])) {
			result.push(chunk)
		}
		
		// Verifica
		expect(result).to.deep.include({ type: "reasoning", reasoning: "Spiegazione logica" })
	})

	it("✅ should yield usage chunk with correct token/cost", async () => {
		// Prepara
		const handler = createTestHandler("deepseek-chat")
		handler.setMockStream(createMockStream([
			{
				choices: [{ delta: {} }],
				usage: {
					prompt_tokens: 100,
					completion_tokens: 50,
					prompt_cache_hit_tokens: 60,
					prompt_cache_miss_tokens: 40,
				},
			},
		]))
		
		// Esegui
		const result: ApiStreamChunk[] = []
		for await (const chunk of handler.createMessage("prompt", [])) {
			result.push(chunk)
		}
		
		// Verifica
		const usageChunk = result.find(c => c.type === "usage")
		expect(usageChunk).to.exist
		expect((usageChunk as any).totalCost).to.be.greaterThan(0)
	})

	it("✅ should stream correctly using for-await", async () => {
		// Prepara
		const handler = createTestHandler("deepseek-chat")
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: "Uno" } }] },
			{ choices: [{ delta: { content: "Due" } }] },
		]))
		
		// Esegui
		let text = ""
		for await (const chunk of handler.createMessage("prompt", [])) {
			if (chunk.type === "text") {
				text += chunk.text
			}
		}
		
		// Verifica
		expect(text).to.equal("UnoDue")
	})

	it("✅ should retry on transient errors", async function() {
		// Aumentiamo il timeout per questo test
		this.timeout(5000)
		
		// Prepara
		const handler = createTestHandler("deepseek-chat")
		handler.simulateErrorOnFirstAttempt()
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: "Risposta dopo retry" } }] }
		]))
		
		// Esegui
		const result: ApiStreamChunk[] = []
		for await (const chunk of handler.createMessage("prompt", [])) {
			result.push(chunk)
		}
		
		// Verifica
		expect(result.length).to.equal(1)
		expect(result[0]).to.deep.include({ type: "text", text: "Risposta dopo retry" })
	})

	it("✅ should handle deepseek-reasoner message conversion", async () => {
		// Prepara
		const handler = createTestHandler("deepseek-reasoner")
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: "Risposta" } }] }
		]))
		
		// Esegui
		const result: ApiStreamChunk[] = []
		for await (const chunk of handler.createMessage("System prompt", [
			{ role: "user", content: "Domanda" }
		])) {
			result.push(chunk)
		}
		
		// Verifica
		const captured = handler.getCapturedMessages()
		expect(captured).to.have.length(2)
		expect(result[0]).to.deep.include({ type: "text", text: "Risposta" })
	})
}) 