/**
 * Mock per l'API di VS Code usato nei test
 */

const vscode = {
    OutputChannel: class {
        constructor(name) {
            this.name = name;
            this.content = [];
        }
        
        append(text) {
            this.content.push(text);
        }
        
        appendLine(text) {
            this.content.push(text + '\n');
        }
        
        clear() {
            this.content = [];
        }
        
        show() {
            // No-op in tests
        }
        
        hide() {
            // No-op in tests
        }
        
        dispose() {
            // No-op in tests
        }
    },
    
    window: {
        createOutputChannel: (name) => new vscode.OutputChannel(name),
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn()
    },
    
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn(),
            update: jest.fn(),
            has: jest.fn()
        })
    },
    
    Uri: {
        file: (path) => ({ fsPath: path, path }),
        parse: (uri) => ({ fsPath: uri, path: uri })
    },
    
    // Livelli di log di VS Code
    LogLevel: {
        Off: 0,
        Error: 1,
        Warning: 2,
        Info: 3,
        Debug: 4,
        Trace: 5
    }
};

module.exports = vscode; 