import type { ModelInfo } from "../shared/types/api.types.js.js"

/**
 * Calcola il costo dell'API in base al modello e all'utilizzo dei token
 */
export function calculateApiCostInternal(
	modelInfo: ModelInfo,
	options: {
		inputTokens: number
		outputTokens: number
		cacheCreationInputTokens?: number
		cacheReadInputTokens?: number
	}
): number {
	const { inputTokens, outputTokens, cacheCreationInputTokens = 0, cacheReadInputTokens = 0 } = options

	// Calcola il costo dell'input e dell'output
	const inputCost = ((modelInfo.inputPrice || (modelInfo.pricing?.input ?? 0)) / 1_000_000) * inputTokens
	const outputCost = ((modelInfo.outputPrice || (modelInfo.pricing?.output ?? 0)) / 1_000_000) * outputTokens

	// Calcola il costo del caching, se supportato
	const cacheWritesCost = ((modelInfo.cacheWritesPrice || 0) / 1_000_000) * cacheCreationInputTokens
	const cacheReadsCost = ((modelInfo.cacheReadsPrice || 0) / 1_000_000) * cacheReadInputTokens

	// Il costo totale è la somma di tutti i costi
	return inputCost + outputCost + cacheWritesCost + cacheReadsCost
}

// For Anthropic compliant usage, the input tokens count does NOT include the cached tokens
export function calculateApiCostAnthropic(
	modelInfo: ModelInfo,
	inputTokens: number,
	outputTokens: number,
	cacheCreationInputTokens?: number,
	cacheReadInputTokens?: number,
): number {
	const cacheCreationInputTokensNum = cacheCreationInputTokens || 0
	const cacheReadInputTokensNum = cacheReadInputTokens || 0
	return calculateApiCostInternal(modelInfo, { inputTokens, outputTokens, cacheCreationInputTokens: cacheCreationInputTokensNum, cacheReadInputTokens: cacheReadInputTokensNum })
}

// For OpenAI compliant usage, the input tokens count INCLUDES the cached tokens
export function calculateApiCostOpenAI(
	modelInfo: ModelInfo,
	inputTokens: number,
	outputTokens: number,
	cacheCreationInputTokens?: number,
	cacheReadInputTokens?: number,
): number {
	const cacheCreationInputTokensNum = cacheCreationInputTokens || 0
	const cacheReadInputTokensNum = cacheReadInputTokens || 0
	const nonCachedInputTokens = Math.max(0, inputTokens - cacheCreationInputTokensNum - cacheReadInputTokensNum)
	return calculateApiCostInternal(
		modelInfo,
		{ inputTokens: nonCachedInputTokens, outputTokens, cacheCreationInputTokens: cacheCreationInputTokensNum, cacheReadInputTokens: cacheReadInputTokensNum }
	)
}
