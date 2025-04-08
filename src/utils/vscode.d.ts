declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
};
declare let vscode: ReturnType<typeof acquireVsCodeApi>;
export declare const postMessage: (type: string, value: any) => void;
export declare const getState: () => any;
export declare const setState: (state: any) => void;
export default vscode;
//# sourceMappingURL=vscode.d.ts.map