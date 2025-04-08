let vscode;
try {
    vscode = acquireVsCodeApi();
}
catch (error) {
    // Mock per l'ambiente di test
    vscode = {
        postMessage: () => { },
        getState: () => ({}),
        setState: () => { }
    };
}
export const postMessage = (type, value) => {
    vscode.postMessage({ type, value });
};
export const getState = () => vscode.getState();
export const setState = (state) => vscode.setState(state);
export default vscode;
//# sourceMappingURL=vscode.js.map