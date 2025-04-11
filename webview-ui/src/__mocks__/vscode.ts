/**
 * @file vscode.ts
 * @description Mock del modulo vscode per i test
 */

// Implementazione base di OutputChannel
class MockOutputChannel {
  name: string;
  content: string = "";
  
  constructor(name: string) {
    this.name = name;
  }
  
  append(value: string): void {
    this.content += value;
  }
  
  appendLine(value: string): void {
    this.content += value + "\n";
  }
  
  clear(): void {
    this.content = "";
  }
  
  show(): void {
    // Mock dell'implementazione
  }
  
  hide(): void {
    // Mock dell'implementazione
  }
  
  dispose(): void {
    // Mock dell'implementazione
  }
}

// Esporta un mock dell'API vscode
export const window = {
  createOutputChannel: (name: string) => new MockOutputChannel(name),
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showErrorMessage: vi.fn()
};

export const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn(),
    update: vi.fn()
  })
};

export const OutputChannel = MockOutputChannel;

// Altri namespace e funzioni di vscode che potrebbero essere utilizzati
export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn()
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, path }),
  parse: (path: string) => ({ fsPath: path, path })
};

export const env = {
  clipboard: {
    writeText: vi.fn()
  }
};

// Tipi di eventi
export type Event<T> = (listener: (e: T) => any) => { dispose: () => void };

// Crea un evento mock
export function createMockEvent<T>(): { fire: (data: T) => void, event: Event<T> } {
  const listeners: ((e: T) => any)[] = [];
  
  const fire = (data: T): void => {
    for (const listener of listeners) {
      listener(data);
    }
  };
  
  const event: Event<T> = (listener: (e: T) => any) => {
    listeners.push(listener);
    return {
      dispose: () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }
    };
  };
  
  return { fire, event };
}

// Esporta enum e altre costanti
export enum LogLevel {
  Trace = 0,
  Debug = 1,
  Info = 2,
  Warning = 3,
  Error = 4,
  Critical = 5,
  Off = 6
}

// Imposta vi come globale per le funzioni mock
declare global {
  // eslint-disable-next-line no-var
  var vi: any;
} 