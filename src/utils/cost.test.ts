import { describe, expect, test } from "vitest"
import { calculateApiCostAnthropic, calculateApiCostOpenAI } from "./cost.js.js"
import type { ModelInfo } from "../shared/api.js.js"

describe("Cost Utilities", () => {
	describe("calculateApiCostAnthropic", () => {
		test("should calculate basic input/output costs", () => {
			const modelInfo: ModelInfo = {
				id: "test-model",
				name: "Test Model",
				context_length: 8192,
				supportsPromptCache: false,
				inputPrice: 3.0, // $3 per million tokens
				outputPrice: 15.0, // $15 per million tokens
			}

			const cost = calculateApiCostAnthropic(modelInfo, 1000, 500)
			// Input: (3.0 / 1_000_000) * 1000 = 0.003
			// Output: (15.0 / 1_000_000) * 500 = 0.0075
			// Total: 0.003 + 0.0075 = 0.0105
			expect(cost).toBeCloseTo(0.0105, 5)
		})

		test("should handle missing prices", () => {
			const modelInfo: ModelInfo = {
				id: "test-model",
				name: "Test Model",
				context_length: 8192,
				supportsPromptCache: true,
				// No prices specified
			}

			const cost = calculateApiCostAnthropic(modelInfo, 1000, 500)
			expect(cost).toBe(0)
		})

		test("should use real model configuration (Claude 3.5 Sonnet)", () => {
			const modelInfo: ModelInfo = {
				id: "claude-3-5-sonnet",
				name: "Claude 3.5 Sonnet",
				context_length: 200000,
				maxTokens: 8192,
				contextWindow: 200_000,
				supportsImages: true,
				supportsComputerUse: true,
				supportsPromptCache: true,
				inputPrice: 3.0,
				outputPrice: 15.0,
				cacheWritesPrice: 3.75,
				cacheReadsPrice: 0.3,
			}

			const cost = calculateApiCostAnthropic(modelInfo, 2000, 1000, 1500, 500)
			// Cache writes: (3.75 / 1_000_000) * 1500 = 0.005625
			// Cache reads: (0.3 / 1_000_000) * 500 = 0.00015
			// Input: (3.0 / 1_000_000) * 2000 = 0.006
			// Output: (15.0 / 1_000_000) * 1000 = 0.015
			// Total: 0.005625 + 0.00015 + 0.006 + 0.015 = 0.026775
			expect(cost).toBeCloseTo(0.026775, 5)
		})

		test("should handle zero token counts", () => {
			const modelInfo: ModelInfo = {
				id: "test-model",
				name: "Test Model",
				context_length: 8192,
				supportsPromptCache: true,
				inputPrice: 3.0,
				outputPrice: 15.0,
				cacheWritesPrice: 3.75,
				cacheReadsPrice: 0.3,
			}

			const cost = calculateApiCostAnthropic(modelInfo, 0, 0, 0, 0)
			expect(cost).toBe(0)
		})
	})

	describe("calculateApiCostOpenAI", () => {
		test("should calculate basic input/output costs", () => {
			const modelInfo: ModelInfo = {
				id: "test-model",
				name: "Test Model",
				context_length: 8192,
				supportsPromptCache: false,
				inputPrice: 3.0, // $3 per million tokens
				outputPrice: 15.0, // $15 per million tokens
			}

			const cost = calculateApiCostOpenAI(modelInfo, 1000, 500)
			// Input: (3.0 / 1_000_000) * 1000 = 0.003
			// Output: (15.0 / 1_000_000) * 500 = 0.0075
			// Total: 0.003 + 0.0075 = 0.0105
			expect(cost).toBeCloseTo(0.0105, 5)
		})

		test("should handle missing prices", () => {
			const modelInfo: ModelInfo = {
				id: "test-model",
				name: "Test Model",
				context_length: 8192,
				supportsPromptCache: true,
				// No prices specified
			}

			const cost = calculateApiCostOpenAI(modelInfo, 1000, 500)
			expect(cost).toBe(0)
		})

		test("should use real model configuration (Claude 3.5 Sonnet)", () => {
			const modelInfo: ModelInfo = {
				id: "claude-3-5-sonnet",
				name: "Claude 3.5 Sonnet",
				context_length: 200000,
				maxTokens: 8192,
				contextWindow: 200_000,
				supportsImages: true,
				supportsComputerUse: true,
				supportsPromptCache: true,
				inputPrice: 3.0,
				outputPrice: 15.0,
				cacheWritesPrice: 3.75,
				cacheReadsPrice: 0.3,
			}

			const cost = calculateApiCostOpenAI(modelInfo, 2100, 1000, 1500, 500)
			// Cache writes: (3.75 / 1_000_000) * 1500 = 0.005625
			// Cache reads: (0.3 / 1_000_000) * 500 = 0.00015
			// Input: (3.0 / 1_000_000) * (2100 - 1500 - 500) = 0.0003
			// Output: (15.0 / 1_000_000) * 1000 = 0.015
			// Total: 0.005625 + 0.00015 + 0.0003 + 0.015 = 0.021075
			expect(cost).toBeCloseTo(0.021075, 5)
		})

		test("should handle zero token counts", () => {
			const modelInfo: ModelInfo = {
				id: "test-model",
				name: "Test Model",
				context_length: 8192,
				supportsPromptCache: true,
				inputPrice: 3.0,
				outputPrice: 15.0,
				cacheWritesPrice: 3.75,
				cacheReadsPrice: 0.3,
			}

			const cost = calculateApiCostOpenAI(modelInfo, 0, 0, 0, 0)
			expect(cost).toBe(0)
		})
	})
})
