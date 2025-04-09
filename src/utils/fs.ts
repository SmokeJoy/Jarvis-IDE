import * as fs from "fs/promises"
import * as path from "path"

/**
 * Asynchronously creates all non-existing subdirectories for a given file path
 * and collects them in an array for later deletion.
 *
 * @param filePath - The full path to a file.
 * @returns A promise that resolves to an array of newly created directories.
 */
export async function createDirectoriesForFile(filePath: string): Promise<string[]> {
	const newDirectories: string[] = []
	const normalizedFilePath = path.normalize(filePath) // Normalize path for cross-platform compatibility
	const directoryPath = path.dirname(normalizedFilePath)

	let currentPath = directoryPath
	const dirsToCreate: string[] = []

	// Traverse up the directory tree and collect missing directories
	while (!(await fileExistsAtPath(currentPath))) {
		dirsToCreate.push(currentPath)
		currentPath = path.dirname(currentPath)
	}

	// Create directories from the topmost missing one down to the target directory
	for (let i = dirsToCreate.length - 1; i >= 0; i--) {
		const dirToCreate = dirsToCreate[i];
		if (dirToCreate) {
			await fs.mkdir(dirToCreate)
			newDirectories.push(dirToCreate)
		}
	}

	return newDirectories
}

/**
 * Helper function to check if a path exists.
 *
 * @param path - The path to check.
 * @returns A promise that resolves to true if the path exists, false otherwise.
 */
export async function fileExistsAtPath(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}

/**
 * Checks if the path is a directory
 * @param filePath - The path to check.
 * @returns A promise that resolves to true if the path is a directory, false otherwise.
 */
export async function isDirectory(filePath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(filePath)
		return stats.isDirectory()
	} catch {
		return false
	}
}

/**
 * Gets the size of a file in kilobytes
 * @param filePath - Path to the file to check
 * @returns Promise<number> - Size of the file in KB, or 0 if file doesn't exist
 */
export async function getFileSizeInKB(filePath: string): Promise<number> {
	try {
		const stats = await fs.stat(filePath)
		const fileSizeInKB = stats.size / 1000 // Convert bytes to KB (decimal) - matches OS file size display
		return fileSizeInKB
	} catch {
		return 0
	}
}

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
	try {
		await fs.mkdir(dirPath, { recursive: true })
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
			throw error
		}
	}
}

export async function readFile(filePath: string): Promise<string> {
	return fs.readFile(filePath, "utf-8")
}

export async function writeFile(filePath: string, content: string): Promise<void> {
	await ensureDirectoryExists(path.dirname(filePath))
	await fs.writeFile(filePath, content, "utf-8")
}

export async function deleteFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error
		}
	}
}

export async function listFiles(dirPath: string): Promise<string[]> {
	try {
		const files = await fs.readdir(dirPath)
		return files.map((file) => path.join(dirPath, file))
	} catch {
		return []
	}
}

export async function copyFile(src: string, dest: string): Promise<void> {
	await ensureDirectoryExists(path.dirname(dest))
	await fs.copyFile(src, dest)
}
