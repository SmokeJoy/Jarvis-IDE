import { exec } from 'child_process';
import * as path from 'path';

export function runPython(script: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, `../../../${script}`);
    const command = `python "${fullPath}" ${args.join(' ')}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr || error.message);
      }
      resolve(stdout);
    });
  });
} 