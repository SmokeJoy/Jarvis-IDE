import { describe, it } from "vitest"
import { expect } from "vitest"
import { findLastIndex, findLast } from "./array.js"
import type { ChatMessage } from "./types.js"

describe("Array Utilities", () => {
	describe("findLastIndex", () => {
		it("should find last matching element's index", () => {
			const array = [1, 2, 3, 2, 1]
			const index = findLastIndex(array, (x) => x === 2)
			expect(index).toBe(3) // last '2' is at index 3
		})

		it("should return -1 when no element matches", () => {
			const array = [1, 2, 3]
			const index = findLastIndex(array, (x) => x === 4)
			expect(index).toBe(-1)
		})

		it("should handle empty arrays", () => {
			const array: number[] = []
			const index = findLastIndex(array, (x) => x === 2)
			expect(index).toBe(-1)
		})

		it("should work with different types", () => {
			const array = ["a", "b", "c", "b", "a"]
			const index = findLastIndex(array, (x) => x === "b")
			expect(index).toBe(3)
		})

		it("should provide correct index in predicate", () => {
			const array = [1, 2, 3]
			const indices: number[] = []
			findLastIndex(array, (_, index) => {
				indices.push(index)
				return false
			})
			expect(indices).to.deep.equal([2, 1, 0]) // Should iterate in reverse
		})

		it("should provide array reference in predicate", () => {
			const array = [1, 2, 3]
			findLastIndex(array, (_, __, arr) => {
				expect(arr).toBe(array) // Should pass original array
				return false
			})
		})

		it("should find last index matching predicate", () => {
			const array = [1, 2, 3, 2, 1]
			const indices: number[] = []
			
			for (let i = findLastIndex(array, x => x === 2); i >= 0; i = findLastIndex(array, x => x === 2, i - 1)) {
				indices.push(i)
			}
			
			expect(indices).to.deep.equal([3, 1])
		})

		it("should handle empty array", () => {
			const array: number[] = []
			const index = findLastIndex(array, x => x === 1)
			expect(index).toBe(-1)
		})

		it("should handle no match", () => {
			const array = [1, 2, 3]
			const index = findLastIndex(array, x => x === 4)
			expect(index).toBe(-1)
		})
	})

	describe("findLast", () => {
		it("should find last matching element", () => {
			const array = [1, 2, 3, 2, 1]
			const element = findLast(array, (x) => x === 2)
			expect(element).toBe(2)
		})

		it("should return undefined when no element matches", () => {
			const array = [1, 2, 3]
			const element = findLast(array, (x) => x === 4)
			expect(element).toBeUndefined()
		})

		it("should handle empty arrays", () => {
			const array: number[] = []
			const element = findLast(array, (x) => x === 1)
			expect(element).toBeUndefined()
		})

		it("should work with object arrays", () => {
			const array = [
				{ id: 1, value: "a" },
				{ id: 2, value: "b" },
				{ id: 3, value: "a" },
			]
			const element = findLast(array, (x) => x.value === "a")
			expect(element).toEqual({ id: 3, value: "a" })
		})

		it("should provide correct index in predicate", () => {
			const array = [1, 2, 3]
			const indices: number[] = []
			findLast(array, (_, index) => {
				indices.push(index)
				return false
			})
			expect(indices).to.deep.equal([2, 1, 0]) // Should iterate in reverse
		})

		it("should find last element matching predicate", () => {
			const array = [1, 2, 3, 2, 1]
			const element = findLast(array, x => x === 2)
			expect(element).toBe(2)
		})

		it("should handle empty array", () => {
			const array: Array<{ id: number, value: string }> = []
			const element = findLast(array, x => x.value === "a")
			expect(element).toBeUndefined()
		})

		it("should handle no match", () => {
			const array = [{ id: 1, value: "a" }]
			const element = findLast(array, x => x.value === "b")
			expect(element).toBeUndefined()
		})

		it("should find last element with fromIndex", () => {
			const array = [1, 2, 3, 2, 1]
			const element = findLast(array, x => x === 2, 1)
			expect(element).toBe(2)
		})

		it("should handle reverse iteration", () => {
			const array = [1, 2, 3, 2, 1]
			const indices: number[] = []
			
			for (let i = array.length - 1; i >= 0; i--) {
				if (array[i] === 2) {
					indices.push(i)
				}
			}
			
			expect(indices).to.deep.equal([3, 1])
		})
	})
})
