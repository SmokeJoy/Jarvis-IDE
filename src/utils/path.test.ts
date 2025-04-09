import { describe, expect, test } from "vitest"
import * as path from "path"
import type {
	arePathsEqual,
	getRelativePath,
	getAbsolutePath,
	isSubPath,
	joinPaths,
	normalizePath,
	getExtension,
	getBasename,
	getDirname,
	getReadablePath
} from "./path.js.js"

describe("Path Utils", () => {
	test("arePathsEqual should compare paths correctly", () => {
		expect(arePathsEqual("/path/to/file", "/path/to/file")).toBe(true)
		expect(arePathsEqual("/path/to/file", "/path/to/other")).toBe(false)
		expect(arePathsEqual("/path/to/file", "/PATH/TO/FILE")).toBe(true)
		expect(arePathsEqual("/path/to/file/", "/path/to/file")).toBe(true)
		expect(arePathsEqual("C:\\path\\to\\file", "C:/path/to/file")).toBe(true)
	})

	test("getRelativePath should return correct relative path", () => {
		const from = path.normalize("/path/to")
		const to = path.normalize("/path/to/file")
		const other = path.normalize("/path/other")
		
		expect(getRelativePath(from, to)).toBe(path.normalize("file"))
		expect(getRelativePath(from, other)).toBe(path.normalize("../other"))
	})

	test("getAbsolutePath should return correct absolute path", () => {
		const basePath = path.normalize("/path/to")
		const relativePath = path.normalize("file")
		const otherPath = path.normalize("../other")
		
		expect(getAbsolutePath(relativePath, basePath)).toBe(path.normalize("/path/to/file"))
		expect(getAbsolutePath(otherPath, basePath)).toBe(path.normalize("/path/other"))
	})

	test("isSubPath should check paths correctly", () => {
		const parent = path.normalize("/path/to")
		const child = path.normalize("/path/to/file")
		const other = path.normalize("/path/other")
		
		expect(isSubPath(parent, child)).toBe(true)
		expect(isSubPath(parent, other)).toBe(false)
	})

	test("joinPaths should join paths correctly", () => {
		const joined = joinPaths("path", "to", "file")
		expect(joined).toBe(path.normalize("path/to/file"))
		
		const joinedAbs = joinPaths("/path", "to", "file")
		expect(joinedAbs).toBe(path.normalize("/path/to/file"))
	})

	test("normalizePath should normalize paths correctly", () => {
		const dirty = path.normalize("path//to/../to/./file")
		expect(normalizePath(dirty)).toBe(path.normalize("path/to/file"))
	})

	test("getExtension should return correct file extension", () => {
		expect(getExtension("/path/to/file.txt")).toBe(".txt")
		expect(getExtension("/path/to/file")).toBe("")
	})

	test("getBasename should return correct file name", () => {
		expect(getBasename("/path/to/file.txt")).toBe("file.txt")
		expect(getBasename("/path/to/file")).toBe("file")
	})

	test("getDirname should return correct directory name", () => {
		expect(getDirname("/path/to/file.txt")).toBe(path.normalize("/path/to"))
		expect(getDirname("/path/to/file")).toBe(path.normalize("/path/to"))
	})

	describe("getReadablePath", () => {
		test("should show relative paths within cwd", () => {
			const cwd = path.normalize("/home/user/project")
			const filePath = path.normalize("/home/user/project/src/file.txt")
			expect(getReadablePath(cwd, filePath)).toBe("src/file.txt")
		})

		test("should show basename when path equals cwd", () => {
			const cwd = path.normalize("/home/user/project")
			expect(getReadablePath(cwd, cwd)).toBe("project")
		})

		test("should show absolute path when outside cwd", () => {
			const cwd = path.normalize("/home/user/project")
			const filePath = path.normalize("/home/user/other/file.txt")
			expect(getReadablePath(cwd, filePath)).toBe(filePath.replace(/\\/g, "/"))
		})
	})

	test("should get relative path", () => {
		const absolutePath = "/home/user/project/src/file.ts";
		const basePath = "/home/user/project";
		const relativePath = path.relative(basePath, absolutePath);
		expect(relativePath).toBe("src/file.ts");
	});

	test("should get absolute path", () => {
		const relativePath = "src/file.ts";
		const basePath = "/home/user/project";
		const absolutePath = path.resolve(basePath, relativePath);
		expect(absolutePath).toBe("/home/user/project/src/file.ts");
	});

	test("should check if path is subpath", () => {
		const parentPath = "/home/user/project";
		const childPath = "/home/user/project/src/file.ts";
		const isSubPath = childPath.startsWith(parentPath);
		expect(isSubPath).toBe(true);
	});

	test("should join paths", () => {
		const paths = ["home", "user", "project", "src", "file.ts"];
		const joinedPath = path.join(...paths);
		expect(joinedPath).toBe("home/user/project/src/file.ts");
	});

	test("should normalize path", () => {
		const dirtyPath = "home//user/./project/../project/src/file.ts";
		const normalizedPath = path.normalize(dirtyPath);
		expect(normalizedPath).toBe("home/user/project/src/file.ts");
	});

	test("should get extension", () => {
		const filePath = "file.ts";
		const extension = path.extname(filePath);
		expect(extension).toBe(".ts");
	});

	test("should get basename", () => {
		const filePath = "/home/user/project/src/file.ts";
		const basename = path.basename(filePath);
		expect(basename).toBe("file.ts");
	});

	test("should get dirname", () => {
		const filePath = "/home/user/project/src/file.ts";
		const dirname = path.dirname(filePath);
		expect(dirname).toBe("/home/user/project/src");
	});
})
