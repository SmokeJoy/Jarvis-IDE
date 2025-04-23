import { expect } from 'chai';
import { describe, it } from 'mocha';

// Mock di createMockStream
function createMockStream(chunks) {
	let index = 0;
	return {
		[Symbol.asyncIterator]() {
			return {
				async next() {
					if (index >= chunks.length) {
						return { done: true, value: undefined };
					}
					return { done: false, value: chunks[index++] };
				}
			};
		}
	};
}

// Mock di DeepSeekHandler per i test
class MockDeepSeekHandler {
	constructor() {
		this.mockStream = null;
		this.capturedMessages = null;
	}

	// Metodo per impostare lo stream mock
	setMockStream(stream) {
		this.mockStream = stream;
	}

	// Mock del metodo getModel
	getModel() {
		return {
			id: 'deepseek-chat',
			info: {
				context_length: 4096,
				pricing: { prompt: 0.0001, completion: 0.0002 },
				maxTokens: 1024,
				supportsPromptCache: true,
			}
		};
	}

	// Mock del metodo createMessage
	async *createMessage(systemPrompt, messages) {
		// Memorizza i messaggi per il test
		this.capturedMessages = messages;

		// Verifica se dobbiamo simulare un errore
		if (this.shouldFailOnFirstAttempt && !this.hasAttempted) {
			this.hasAttempted = true;
			throw new Error('Errore simulato al primo tentativo');
		}

		// Genera chunk dall'input mockato
		if (!this.mockStream) {
			throw new Error('Nessuno stream mock definito');
		}

		// Trasforma i chunk in formato API
		for await (const chunk of this.mockStream) {
			// Gestione testo
			const delta = chunk.choices?.[0]?.delta;
			if (delta?.content) {
				yield { type: 'text', text: delta.content };
			}

			// Gestione reasoning (deepseek-reasoner)
			if (delta?.reasoning_content) {
				yield { type: 'reasoning', reasoning: delta.reasoning_content };
			}

			// Gestione usage
			if (chunk.usage) {
				const inputTokens = chunk.usage?.prompt_tokens || 0;
				const outputTokens = chunk.usage?.completion_tokens || 0;
				const cacheReadTokens = chunk.usage?.prompt_cache_hit_tokens || 0;
				const cacheWriteTokens = chunk.usage?.prompt_cache_miss_tokens || 0;
				
				// Calcolo semplificato del costo per i test
				const totalCost = (inputTokens * 0.0001) + (outputTokens * 0.0002);
				
				yield {
					type: 'usage',
					inputTokens,
					outputTokens,
					cacheWriteTokens,
					cacheReadTokens,
					totalCost,
				};
			}
		}
	}

	// Simulare un errore al primo tentativo
	simulateErrorOnFirstAttempt() {
		this.shouldFailOnFirstAttempt = true;
		this.hasAttempted = false;
	}
}

// Tests
describe('DeepSeekHandler mock tests', () => {
	it('should yield text chunks', async () => {
		const handler = new MockDeepSeekHandler();
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: 'Ciao' } }] },
			{ choices: [{ delta: { content: ' mondo!' } }] },
		]));

		const result = [];
		for await (const chunk of handler.createMessage('prompt', [])) {
			result.push(chunk);
		}

		expect(result).to.deep.include.members([
			{ type: 'text', text: 'Ciao' },
			{ type: 'text', text: ' mondo!' },
		]);
	});

	it('should yield reasoning chunks', async () => {
		const handler = new MockDeepSeekHandler();
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { reasoning_content: 'Spiegazione logica' } }] },
		]));

		const result = [];
		for await (const chunk of handler.createMessage('prompt', [])) {
			result.push(chunk);
		}

		expect(result).to.deep.include({ type: 'reasoning', reasoning: 'Spiegazione logica' });
	});

	it('should yield usage chunk with correct token/cost', async () => {
		const handler = new MockDeepSeekHandler();
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
		]));

		const result = [];
		for await (const chunk of handler.createMessage('prompt', [])) {
			result.push(chunk);
		}

		const usageChunk = result.find(c => c.type === 'usage');
		expect(usageChunk).to.exist;
		expect(usageChunk.totalCost).to.be.greaterThan(0);
	});

	it('should stream correctly using for-await', async () => {
		const handler = new MockDeepSeekHandler();
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: 'Uno' } }] },
			{ choices: [{ delta: { content: 'Due' } }] },
		]));

		let text = '';
		for await (const chunk of handler.createMessage('prompt', [])) {
			if (chunk.type === 'text') {
				text += chunk.text;
			}
		}

		expect(text).to.equal('UnoDue');
	});

	it('should save messages for later verification', async () => {
		const handler = new MockDeepSeekHandler();
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: 'Risposta' } }] }
		]));

		const userMessages = [
			{ role: 'user', content: 'Domanda' }
		];

		const result = [];
		for await (const chunk of handler.createMessage('System prompt', userMessages)) {
			result.push(chunk);
		}

		expect(handler.capturedMessages).to.deep.equal(userMessages);
		expect(result[0]).to.deep.include({ type: 'text', text: 'Risposta' });
	});

	it('should be able to handle errors with try/catch', async () => {
		const handler = new MockDeepSeekHandler();
		handler.simulateErrorOnFirstAttempt();
		handler.setMockStream(createMockStream([
			{ choices: [{ delta: { content: 'Risposta' } }] }
		]));

		// Prima chiamata - dovrebbe fallire
		try {
			for await (const chunk of handler.createMessage('prompt', [])) {
				// Non dovremmo arrivare qui
				expect.fail('Non dovremmo arrivare qui');
			}
		} catch (error) {
			expect(error.message).to.equal('Errore simulato al primo tentativo');
		}

		// Seconda chiamata - dovrebbe funzionare
		const result = [];
		for await (const chunk of handler.createMessage('prompt', [])) {
			result.push(chunk);
		}

		expect(result.length).to.equal(1);
		expect(result[0]).to.deep.include({ type: 'text', text: 'Risposta' });
	});
}); 