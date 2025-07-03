import { execaCommand } from 'execa';

/**
 * Executes a shell command in the specified working directory.
 */
export async function executeCommand(command: string, options: { cwd?: string } = {}): Promise<void> {
  await execaCommand(command, {
    shell: true,
    cwd: options.cwd,
    stdio: 'inherit', // Inherit stdio to show output in the console
  });
  
}