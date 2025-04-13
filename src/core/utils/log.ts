import * as vscode from 'vscode';

export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;

  static initialize(outputChannel: vscode.OutputChannel) {
    Logger.outputChannel = outputChannel;
  }

  static log(...args: any[]) {
    console.log('[LOG]:', ...args);
    Logger.outputChannel?.appendLine('[LOG]: ' + args.join(' '));
  }

  static error(...args: any[]) {
    console.error('[ERROR]:', ...args);
    Logger.outputChannel?.appendLine('[ERROR]: ' + args.join(' '));
  }

  static warn(...args: any[]) {
    console.warn('[WARN]:', ...args);
    Logger.outputChannel?.appendLine('[WARNING]: ' + args.join(' '));
  }
}
