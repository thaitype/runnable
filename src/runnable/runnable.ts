import { execa } from 'execa';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { MaybePromise } from 'src/types.js';
import { merge } from 'lodash-es';
import { PrettyLogger, type ILogger } from '@thaitype/core-utils';
import c from 'ansis';

export const MARK_CHECK = c.green('✔');

type WhenFn = () => MaybePromise<boolean>;

export interface RunnableStep {
  name: string;
  shell?: string;
  when?: WhenFn;
  skip_if_done?: boolean;
}

interface StateFile {
  [stepName: string]: boolean;
}

export interface RunnableOptions {
  // Option
  stateFilePath: string;
  logger: ILogger;
}

export const defaultRunnableOptions: RunnableOptions = {
  stateFilePath: 'step-state.json',
  logger: new PrettyLogger(),
};

export class Runnable {
  private logger: ILogger;
  private stateFilePath: string;
  private options: RunnableOptions;
  private state: StateFile;

  constructor(options?: Partial<RunnableOptions>) {
    this.options = merge({}, defaultRunnableOptions, options);
    this.logger = this.options.logger;
    this.stateFilePath = path.resolve(this.options.stateFilePath);
    this.state = existsSync(this.stateFilePath) ? JSON.parse(readFileSync(this.stateFilePath, 'utf-8')) : {};
  }

  private saveState() {
    writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  async run(steps: RunnableStep[]) {
    for (const step of steps) {
      const { name, shell, when, skip_if_done } = step;

      if (skip_if_done && this.state[name]) {
        this.logger.log(`${MARK_CHECK}  [${name}] already done. Skipping.`);
        continue;
      }

      if (when && !(await when())) {
        this.logger.info(`[${name}] skipped by condition`);
        continue;
      }

      this.logger.info(`Running step: ${name}`);
      try {
        if (shell) {
          const subprocess = execa(shell, { shell: true });
          subprocess.stdout?.pipe(process.stdout);
          subprocess.stderr?.pipe(process.stderr);
          await subprocess;
        }
        this.state[name] = true;
        this.saveState();
        this.logger.log(`${MARK_CHECK}  [${name}] completed`);
      } catch (err) {
        this.logger.error(`[${name}] failed:`, this.serializeError(err));
        break;
      }
    }
  }

  serializeError(err: unknown): Record<string, unknown> {
    try {
      return JSON.parse(JSON.stringify(err));
    } catch {
      return {
        message: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      };
    }
  }
}
