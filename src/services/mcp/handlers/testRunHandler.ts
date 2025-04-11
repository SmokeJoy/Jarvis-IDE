import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import type { McpToolHandler, McpToolResult } from "../../../shared/types/mcp.types.js";

const execAsync = promisify(exec);

const mockVscode = {
  workspace: {
    workspaceFolders: null
  }
};

const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export const testRunHandler: McpToolHandler = async (args): Promise<McpToolResult> => {
  const testPath = args?.path || '.';
  const framework = args?.framework || 'jest';
  const filter = args?.filter;
  const coverage = args?.coverage === true;
  const watch = args?.watch === true;

  try {
    let workspacePath = process.cwd();
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }

    const fullPath = path.isAbsolute(testPath) ? testPath : path.join(workspacePath, testPath);
    const exists = await fileExists(fullPath);

    if (!exists) {
      return {
        success: false,
        output: null,
        error: `Il percorso '${testPath}' non esiste`
      };
    }

    let cmd = '';
    if (framework === 'jest') {
      cmd = `npx jest ${fullPath}`;
      if (filter) cmd += ` -t "${filter}"`;
      if (coverage) cmd += ` --coverage`;
      if (watch) cmd += ` --watchAll`;
    } else if (framework === 'pytest') {
      cmd = `pytest ${fullPath}`;
      if (filter) cmd += ` -k "${filter}"`;
      if (coverage) cmd = `coverage run -m ${cmd} && coverage report`;
    } else {
      return {
        success: false,
        output: null,
        error: `Framework '${framework}' non supportato`
      };
    }

    const { stdout, stderr } = await execAsync(cmd, { cwd: workspacePath });

    return {
      success: true,
      output: JSON.stringify({
        summary: `Test eseguiti con successo usando ${framework}`,
        stdout,
        stderr
      })
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Errore nell'esecuzione dei test: ${error.message}`
    };
  }
}; 