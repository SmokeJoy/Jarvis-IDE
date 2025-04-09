export function secondsToMs(seconds: number): number {
	return seconds * 1000
}

export function msToSeconds(ms: number): number {
	return ms / 1000
}

export function formatDuration(ms: number): string {
	const seconds = Math.floor(msToSeconds(ms))
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`
	}
	return `${seconds}s`
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getTimestamp(): number {
	return Date.now()
}

export function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toISOString()
}
