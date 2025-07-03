import type { ILogger } from '@thaitype/core-utils';
import { execaCommand, type Options as ExecaOptions } from 'execa';

/**
 * Executes a shell command in the specified working directory.
 */
export async function executeCommand(command: string, options: {
  cwd?: string,
  logger?: ILogger,
  execaOptions?: ExecaOptions
} = {}
): Promise<void> {
  options.logger?.info(`Executing command: ${command}`);
  await execaCommand(command, {
    shell: true,
    cwd: options.cwd,
    stdio: 'inherit', // Inherit stdio to show output in the console
    ...options.execaOptions,
  });

}