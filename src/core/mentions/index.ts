import * as vscode from "vscode"
import * as path from "path"
import { openFile } from "../../integrations/misc/open-file.js"
import { UrlContentFetcher } from "../../services/browser/UrlContentFetcher.js"
import { mentionRegexGlobal } from "../../shared/context-mentions.js"
import fs from "fs/promises"
import { extractTextFromFile } from "../../integrations/misc/extract-text.js"
import { isBinaryFile } from "isbinaryfile"
import { diagnosticsToProblemsString } from "../../integrations/diagnostics.js"
import { getLatestTerminalOutput } from "../../integrations/terminal/get-latest-output.js"
import { getCommitInfo } from "../../utils/git.js"
import type { getWorkingState } from "../../utils/git.js"

export function openMention(mention?: string): void {
	if (!mention) {
		return
	}

	const cwd = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0)
	if (!cwd) {
		return
	}

	if (mention.startsWith("/")) {
		const relPath = mention.slice(1)
		const absPath = path.resolve(cwd, relPath)
		if (mention.endsWith("/")) {
			vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(absPath))
		} else {
			openFile(absPath)
		}
	} else if (mention === "problems") {
		vscode.commands.executeCommand("workbench.actions.view.problems")
	} else if (mention === "terminal") {
		vscode.commands.executeCommand("workbench.action.terminal.focus")
	} else if (mention.startsWith("http")) {
		vscode.env.openExternal(vscode.Uri.parse(mention))
	}
}

export async function parseMentions(text: string, cwd: string, urlContentFetcher: UrlContentFetcher): Promise<string> {
	const mentions: Set<string> = new Set()
	let parsedText = text.replace(mentionRegexGlobal, (match, mention) => {
		mentions.add(mention)
		if (mention.startsWith("http")) {
			return `'${mention}' (see below for site content)`
		} else if (mention.startsWith("/")) {
			const mentionPath = mention.slice(1) // Remove the leading '/'
			return mentionPath.endsWith("/")
				? `'${mentionPath}' (see below for folder content)`
				: `'${mentionPath}' (see below for file content)`
		} else if (mention === "problems") {
			return `Workspace Problems (see below for diagnostics)`
		} else if (mention === "terminal") {
			return `Terminal Output (see below for output)`
		} else if (mention === "git-changes") {
			return `Working directory changes (see below for details)`
		} else if (/^[a-f0-9]{7,40}$/.test(mention)) {
			return `Git commit '${mention}' (see below for commit info)`
		}
		return match
	})

	const urlMention = Array.from(mentions).find((mention) => mention.startsWith("http"))
	let launchBrowserError: Error | undefined
	if (urlMention) {
		try {
			await urlContentFetcher.launchBrowser()
		} catch (error) {
			launchBrowserError = error instanceof Error ? error : new Error(String(error))
			vscode.window.showErrorMessage(
				`Error fetching content for ${urlMention}: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	}

	// Filter out duplicate mentions while preserving order
	const uniqueMentions = Array.from(new Set(mentions))

	for (const mention of uniqueMentions) {
		if (mention.startsWith("http")) {
			let result: string
			if (launchBrowserError) {
				result = `Error fetching content: ${launchBrowserError.message}`
			} else {
				try {
					const markdown = await urlContentFetcher.urlToMarkdown(mention)
					result = markdown
				} catch (error) {
					vscode.window.showErrorMessage(
						`Error fetching content for ${mention}: ${error instanceof Error ? error.message : String(error)}`
					)
					result = `Error fetching content: ${error instanceof Error ? error.message : String(error)}`
				}
			}
			parsedText += `\n\n<url_content url="${mention}">\n${result}\n</url_content>`
		} else if (mention.startsWith("/")) {
			const mentionPath = mention.slice(1)
			try {
				const content = await getFileOrFolderContent(mentionPath, cwd)
				if (mention.endsWith("/")) {
					parsedText += `\n\n<folder_content path="${mentionPath}">\n${content}\n</folder_content>`
				} else {
					parsedText += `\n\n<file_content path="${mentionPath}">\n${content}\n</file_content>`
				}
			} catch (error) {
				if (mention.endsWith("/")) {
					parsedText += `\n\n<folder_content path="${mentionPath}">\nError fetching content: ${
						error instanceof Error ? error.message : String(error)
					}\n</folder_content>`
				} else {
					parsedText += `\n\n<file_content path="${mentionPath}">\nError fetching content: ${
						error instanceof Error ? error.message : String(error)
					}\n</file_content>`
				}
			}
		} else if (mention === "problems") {
			try {
				const problems = getWorkspaceProblems(cwd)
				parsedText += `\n\n<workspace_diagnostics>\n${problems}\n</workspace_diagnostics>`
			} catch (error) {
				parsedText += `\n\n<workspace_diagnostics>\nError fetching diagnostics: ${
					error instanceof Error ? error.message : String(error)
				}\n</workspace_diagnostics>`
			}
		} else if (mention === "terminal") {
			try {
				const terminalOutput = await getLatestTerminalOutput()
				parsedText += `\n\n<terminal_output>\n${terminalOutput}\n</terminal_output>`
			} catch (error) {
				parsedText += `\n\n<terminal_output>\nError fetching terminal output: ${
					error instanceof Error ? error.message : String(error)
				}\n</terminal_output>`
			}
		} else if (mention === "git-changes") {
			try {
				const workingState = await getWorkingState(cwd)
				parsedText += `\n\n<git_working_state>\n${workingState}\n</git_working_state>`
			} catch (error) {
				parsedText += `\n\n<git_working_state>\nError fetching working state: ${
					error instanceof Error ? error.message : String(error)
				}\n</git_working_state>`
			}
		} else if (/^[a-f0-9]{7,40}$/.test(mention)) {
			try {
				const commitInfo = await getCommitInfo(mention, cwd)
				parsedText += `\n\n<git_commit hash="${mention}">\n${commitInfo}\n</git_commit>`
			} catch (error) {
				parsedText += `\n\n<git_commit hash="${mention}">\nError fetching commit info: ${
					error instanceof Error ? error.message : String(error)
				}\n</git_commit>`
			}
		}
	}

	if (urlMention) {
		try {
			await urlContentFetcher.closeBrowser()
		} catch (error) {
			console.error(`Error closing browser: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	return parsedText
}

async function getFileOrFolderContent(mentionPath: string, cwd: string): Promise<string> {
	const absPath = path.resolve(cwd, mentionPath)

	try {
		const stats = await fs.stat(absPath)

		if (stats.isFile()) {
			const isBinary = await isBinaryFile(absPath).catch(() => false)
			if (isBinary) {
				return "(Binary file, unable to display content)"
			}
			const content = await extractTextFromFile(absPath)
			return content
		} else if (stats.isDirectory()) {
			const entries = await fs.readdir(absPath, { withFileTypes: true })
			let folderContent = ""
			const fileContentPromises: Promise<string | undefined>[] = []
			entries.forEach((entry, index) => {
				const isLast = index === entries.length - 1
				const linePrefix = isLast ? "└── " : "├── "
				if (entry.isFile()) {
					folderContent += `${linePrefix}${entry.name}\n`
					const filePath = path.join(mentionPath, entry.name)
					const absoluteFilePath = path.resolve(absPath, entry.name)
					// const relativeFilePath = path.relative(cwd, absoluteFilePath);
					fileContentPromises.push(
						(async () => {
							try {
								const isBinary = await isBinaryFile(absoluteFilePath).catch(() => false)
								if (isBinary) {
									return undefined
								}
								const content = await extractTextFromFile(absoluteFilePath)
								return `<file_content path="${filePath.toPosix()}">\n${content}\n</file_content>`
							} catch (error) {
								return undefined
							}
						})(),
					)
				} else if (entry.isDirectory()) {
					folderContent += `${linePrefix}${entry.name}/\n`
					// not recursively getting folder contents
				} else {
					folderContent += `${linePrefix}${entry.name}\n`
				}
			})
			const fileContents = (await Promise.all(fileContentPromises)).filter((content) => content)
			return `${folderContent}\n${fileContents.join("\n\n")}`.trim()
		} else {
			return `(Failed to read contents of ${mentionPath})`
		}
	} catch (error) {
		throw new Error(
			`Failed to access path "${mentionPath}": ${error instanceof Error ? error.message : String(error)}`
		)
	}
}

function getWorkspaceProblems(cwd: string): string {
	const diagnostics = vscode.languages.getDiagnostics()
	const result = diagnosticsToProblemsString(
		diagnostics,
		[vscode.DiagnosticSeverity.Error, vscode.DiagnosticSeverity.Warning],
		cwd,
	)
	if (!result) {
		return "No errors or warnings detected."
	}
	return result
}
