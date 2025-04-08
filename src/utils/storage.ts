// import * as vscode from "vscode"; // Rimuovi importazione non utilizzata
import * as fs from "fs/promises";
import * as path from "path";
import getFolderSize from "get-folder-size";

/**
 * Gets the total size of tasks and checkpoints directories
 * @param storagePath The base storage path (typically globalStorageUri.fsPath)
 * @returns The total size in bytes, or null if calculation fails
 */
export async function getTotalTasksSize(storagePath: string): Promise<number | null> {
	const tasksDir = path.join(storagePath, "tasks");
	const checkpointsDir = path.join(storagePath, "checkpoints");

	try {
		const tasksSize = await getFolderSize(tasksDir);
		const checkpointsSize = await getFolderSize(checkpointsDir);
		return tasksSize + checkpointsSize;
	} catch (error) {
		console.error("Failed to calculate total task size:", error);
		return null;
	}
}

export async function getFileSize(filePath: string): Promise<number> {
	try {
		const stats = await fs.stat(filePath);
		return stats.size;
	} catch (error) {
		console.error("Error getting file size:", error);
		return 0;
	}
}

export async function getDirectorySize(dirPath: string): Promise<number> {
	try {
		const files = await fs.readdir(dirPath);
		const sizes = await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(dirPath, file);
				const stats = await fs.stat(filePath);
				if (stats.isDirectory()) {
					return getDirectorySize(filePath);
				}
				return stats.size;
			})
		);
		return sizes.reduce((acc, size) => acc + size, 0);
	} catch (error) {
		console.error("Error getting directory size:", error);
		return 0;
	}
}
