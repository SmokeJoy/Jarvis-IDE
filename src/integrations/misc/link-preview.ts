import axios from "axios"
import ogs from "open-graph-scraper"
import { OpenGraphData } from '../../types/global.js.js'

/**
 * Fetches Open Graph metadata from a URL
 * @param url The URL to fetch metadata from
 * @returns Promise resolving to OpenGraphData
 */
export async function fetchOpenGraphData(url: string): Promise<OpenGraphData> {
	const options = {
		url,
		timeout: 10000,
		headers: {
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
		},
		onlyGetOpenGraphInfo: true,
		fetchOptions: {
			headers: {
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
			}
		}
	}

	try {
		const { result } = await ogs(options as any)
		
		// Extract the base URL and make relative URLs absolute
		const baseUrl = new URL(url).origin
		
		// Handle image URLs
		let imageUrl = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url
		if (imageUrl && (imageUrl.startsWith("/") || imageUrl.startsWith("./"))) {
			imageUrl = new URL(imageUrl, baseUrl).href
		}

		return {
			title: result.ogTitle || result.twitterTitle || result.dcTitle || new URL(url).hostname,
			description: result.ogDescription || result.twitterDescription || result.dcDescription || "No description available",
			image: imageUrl,
			url: result.ogUrl || url,
			siteName: result.ogSiteName || new URL(url).hostname,
			type: result.ogType,
		}
	} catch (error) {
		console.error("Error fetching Open Graph data:", error)
		throw error
	}
}

/**
 * Checks if a URL is an image by making a HEAD request and checking the content type
 * @param url The URL to check
 * @returns Promise resolving to boolean indicating if the URL is an image
 */
export async function isImageUrl(url: string): Promise<boolean> {
	try {
		const response = await axios.head(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; VSCodeExtension/1.0; +https://jarvis-ide.dev)",
			},
			timeout: 3000,
		})

		const contentType = response.headers["content-type"]
		return contentType && contentType.startsWith("image/")
	} catch (error) {
		// If we can't determine, fall back to checking the file extension
		return /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif|avif)$/i.test(url)
	}
}
