// Mock implementation of VS Code API
const vscode = {
    // Add any VS Code APIs that your tests need here
    window: {
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
    },
    workspace: {
        getConfiguration: vi.fn(),
    },
    // Add more mock implementations as needed
};

export default vscode; 
 