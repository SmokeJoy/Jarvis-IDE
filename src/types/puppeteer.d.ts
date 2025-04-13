declare module 'puppeteer' {
  export interface Browser {
    close(): Promise<void>;
    newPage(): Promise<Page>;
  }

  export interface Page {
    goto(url: string): Promise<Response | null>;
    content(): Promise<string>;
    close(): Promise<void>;
    evaluate<T>(fn: () => T): Promise<T>;
    evaluateHandle(fn: Function): Promise<any>;
    $eval(selector: string, fn: Function): Promise<any>;
    $$eval(selector: string, fn: Function): Promise<any>;
    $(selector: string): Promise<ElementHandle | null>;
    $$(selector: string): Promise<ElementHandle[]>;
    waitForSelector(selector: string): Promise<ElementHandle | null>;
    waitForFunction(fn: Function): Promise<void>;
  }

  export interface ElementHandle {
    click(): Promise<void>;
    type(text: string): Promise<void>;
    press(key: string): Promise<void>;
    focus(): Promise<void>;
    evaluate(fn: Function): Promise<any>;
  }

  export interface Response {
    ok(): boolean;
    status(): number;
    text(): Promise<string>;
    json(): Promise<any>;
  }

  export interface LaunchOptions {
    headless?: boolean | 'new';
    args?: string[];
    defaultViewport?: {
      width: number;
      height: number;
    };
  }

  export function launch(options?: LaunchOptions): Promise<Browser>;
}
