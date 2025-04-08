import { describe, expect, test, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
	fileExists,
	ensureDirectoryExists,
	readFile,
	writeFile,
	deleteFile,
	listFiles,
	isDirectory,
	copyFile,
} from "./fs.js";

describe("File System Utils", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = path.join(os.tmpdir(), "fs-utils-test-" + Math.random().toString(36).slice(2));
		await fs.mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		try {
			await fs.rm(testDir, { recursive: true });
		} catch {
			// Ignore errors during cleanup
		}
	});

	test("fileExists should check file existence correctly", async () => {
		const filePath = path.join(testDir, "test.txt");
		expect(await fileExists(filePath)).toBe(false);
		await fs.writeFile(filePath, "test");
		expect(await fileExists(filePath)).toBe(true);
	});

	test("ensureDirectoryExists should create directory", async () => {
		const dirPath = path.join(testDir, "nested", "dir");
		await ensureDirectoryExists(dirPath);
		const stats = await fs.stat(dirPath);
		expect(stats.isDirectory()).toBe(true);
	});

	test("readFile and writeFile should work correctly", async () => {
		const filePath = path.join(testDir, "test.txt");
		const content = "test content";
		await writeFile(filePath, content);
		const read = await readFile(filePath);
		expect(read).toBe(content);
	});

	test("deleteFile should remove file", async () => {
		const filePath = path.join(testDir, "test.txt");
		await fs.writeFile(filePath, "test");
		expect(await fileExists(filePath)).toBe(true);
		await deleteFile(filePath);
		expect(await fileExists(filePath)).toBe(false);
	});

	test("listFiles should list directory contents", async () => {
		const files = ["file1.txt", "file2.txt"];
		for (const file of files) {
			await fs.writeFile(path.join(testDir, file), "test");
		}
		const listed = await listFiles(testDir);
		expect(listed.sort()).toEqual(files.map(f => path.join(testDir, f)).sort());
	});

	test("isDirectory should check directory correctly", async () => {
		const dirPath = path.join(testDir, "subdir");
		const filePath = path.join(testDir, "test.txt");
		await fs.mkdir(dirPath);
		await fs.writeFile(filePath, "test");
		expect(await isDirectory(dirPath)).toBe(true);
		expect(await isDirectory(filePath)).toBe(false);
	});

	test("copyFile should copy file correctly", async () => {
		const srcPath = path.join(testDir, "src.txt");
		const destPath = path.join(testDir, "nested", "dest.txt");
		const content = "test content";
		await fs.writeFile(srcPath, content);
		await copyFile(srcPath, destPath);
		const copied = await fs.readFile(destPath, "utf-8");
		expect(copied).toBe(content);
	});
});
