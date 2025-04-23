declare module 'esbuild' {
  export interface BuildOptions {
    entryPoints?: string[];
    outfile?: string;
    bundle?: boolean;
    platform?: 'node' | 'browser';
    target?: string[];
    format?: 'iife' | 'cjs' | 'esm';
    external?: string[];
    minify?: boolean;
    sourcemap?: boolean | 'inline' | 'external';
    outdir?: string;
    define?: { [key: string]: string };
  }

  export interface BuildResult {
    errors: any[];
    warnings: any[];
    outputFiles?: Uint8Array[];
  }

  export function build(options: BuildOptions): Promise<BuildResult>;
} 
 