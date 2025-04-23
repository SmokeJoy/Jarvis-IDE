import * as vscode from 'vscode';

export class LogManager {
    private outputChannel: vscode.OutputChannel;

    constructor(private readonly context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Jarvis IDE');
        context.subscriptions.push(this.outputChannel);
    }

    public info(message: string, ...args: any[]): void {
        this.log('INFO', message, ...args);
    }

    public warn(message: string, ...args: any[]): void {
        this.log('WARN', message, ...args);
    }

    public error(message: string, error?: any, ...args: any[]): void {
        this.log('ERROR', message, ...args);
        if (error) {
            if (error instanceof Error) {
                this.outputChannel.appendLine(`Stack trace: ${error.stack || error.message}`);
            } else {
                this.outputChannel.appendLine(`Error details: ${JSON.stringify(error, null, 2)}`);
            }
        }
    }

    public debug(message: string, ...args: any[]): void {
        // Only log debug messages if debug mode is enabled
        if (this.isDebugMode()) {
            this.log('DEBUG', message, ...args);
        }
    }

    private log(level: string, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;

        if (args.length > 0) {
            logMessage += ' ' + args.map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                }
                return String(arg);
            }).join(' ');
        }

        this.outputChannel.appendLine(logMessage);

        // Show the output channel for errors
        if (level === 'ERROR') {
            this.outputChannel.show(true);
        }
    }

    private isDebugMode(): boolean {
        return vscode.workspace.getConfiguration('jarvis-ide').get<boolean>('debug', false);
    }

    public show(): void {
        this.outputChannel.show();
    }

    public hide(): void {
        this.outputChannel.hide();
    }

    public clear(): void {
        this.outputChannel.clear();
    }
} 