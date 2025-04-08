export function formatLargeNumber(num: number): string {
	if (num >= 1e9) {
		return (num / 1e9).toFixed(1) + "b"
	}
	if (num >= 1e6) {
		return (num / 1e6).toFixed(1) + "m"
	}
	if (num >= 1e3) {
		return (num / 1e3).toFixed(1) + "k"
	}
	return num.toString()
}

// Helper to format cents as dollars with 2 decimal places
export function formatDollars(cents?: number): string {
	if (cents === undefined) {
		return ""
	}

	return (cents / 100).toFixed(2)
}

export function formatTimestamp(timestamp: string): string {
	const date = new Date(timestamp)

	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "2-digit",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	})

	return dateFormatter.format(date)
}

/**
 * Formatta un prezzo in dollari per token
 * @param price - Prezzo per token (può essere undefined)
 * @returns Stringa formattata del prezzo
 */
export const formatPrice = (price?: number): string => {
	if (!price) return '$0.00'
	return `$${(price).toFixed(4)}`
}

/**
 * Formatta un numero con separatori delle migliaia
 * @param num - Numero da formattare
 * @returns Stringa formattata del numero
 */
export const formatNumber = (num: number): string => {
	return num.toLocaleString('it-IT')
}
