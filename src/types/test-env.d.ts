declare namespace Vi {
  interface Mocked<T> {
    mock: {
      calls: any[][];
      results: { type: string; value: any }[];
    };
  }

  function mocked<T>(item: T): Mocked<T>;
  function fn(): jest.Mock;
  function fn<T extends (...args: any[]) => any>(
    implementation: T
  ): jest.Mock<ReturnType<T>, Parameters<T>>;
}

declare global {
  const vi: typeof Vi;

  interface Window {
    initialConfig?: any;
    vscode?: import('vscode-webview').VSCodeAPI;
  }
}
