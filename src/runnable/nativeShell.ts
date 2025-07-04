import { tmpdir } from 'os';
import { writeFileSync, rmSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { ILogger } from '@thaitype/core-utils';
import { type Options as ExecaOptions } from 'execa';
import { executeCommand } from './execute.js';

/**
 * Execute native shell by creating a temp script file.
 */
export async function executeNativeShell(nativeShell: string, options: {
  platform: NodeJS.Platform,
  logger?: ILogger,
  execaOptions?: ExecaOptions
}): Promise<void> {
  const ext = options.platform === 'win32' ? '.ps1' : '.sh';
  const scriptName = `runnable-${randomUUID()}${ext}`;
  const tmpDir = tmpdir();
  const scriptPath = path.join(tmpDir, scriptName);

  writeFileSync(scriptPath, nativeShell, { encoding: 'utf-8' });

  const shellCommand = options.platform === 'win32'
    ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
    : `bash "${scriptPath}"`;

  options.logger?.debug(`------------------------------------------------`);
  options.logger?.debug(`Executing native shell script: \n${nativeShell}`);
  options.logger?.debug(`------------------------------------------------`);

  try {
    await executeCommand(shellCommand, options);
  } finally {
    rmSync(scriptPath, { force: true });
  }
}
