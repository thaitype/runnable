import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { MaybePromise } from 'src/types.js';
import { merge } from 'lodash-es';
import { PrettyLogger, type ILogger } from '@thaitype/core-utils';
import c from 'ansis';
import { executeCommand } from './execute.js';
import type { Options as ExecaOptions  } from 'execa';

export const MARK_CHECK = c.green('✔');

type ShellFn = (command: string) => Promise<void>
type WhenFn = (shell: ShellFn) => MaybePromise<boolean>



export interface RunnableStep {
  name: string;
  shell?: string;
  when?: WhenFn;
  skipIfDone?: boolean;
}

interface StateFile {
  [stepName: string]: boolean;
}

export interface RunnableOptions {
  name: string
  stateFilePath: string;
  logger: ILogger;
  enableStateCheck: boolean;
  execaOptions?: ExecaOptions;
}

export const defaultRunnableOptions: RunnableOptions = {
  name: 'No Name',
  stateFilePath: 'step-state.json',
  logger: new PrettyLogger(),
  enableStateCheck: false,
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

    this.state = this.options.enableStateCheck && existsSync(this.stateFilePath)
      ? JSON.parse(readFileSync(this.stateFilePath, 'utf-8'))
      : {};
  }

  private saveState() {
    if (!this.options.enableStateCheck) return; // ✅ ข้ามถ้าไม่เปิด
    writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  async run(steps: RunnableStep[]) {
    this.logger.log('');
    this.logger.info(`Runnable task "${this.options.name}"`);
    this.logger.log('\n');

    const whenShell: ShellFn = async (cmd) => {
      await executeCommand(cmd, {
        logger: this.logger,
        execaOptions: this.options.execaOptions,
      });
    };

    for (const step of steps) {
      const { name, shell, when, skipIfDone } = step;

      this.logger.log('---------------------------------------');
      this.logger.info(`Start step: ${name}`);

      if (this.options.enableStateCheck && skipIfDone && this.state[name]) {
        this.logger.log(`${MARK_CHECK} [${name}] already done. Skipping.`);
        continue;
      }

      if (when && !(await when(whenShell))) {
        this.logger.info(`[${name}] skipped by condition`);
        continue;
      }

      this.logger.info(`Running step: ${name}`);
      try {
        if (shell) {
          await executeCommand(shell, {
            logger: this.logger,
            execaOptions: this.options.execaOptions,
          });
        }

        if (this.options.enableStateCheck) {
          this.state[name] = true;
          this.saveState();
        }

        this.logger.log(`${MARK_CHECK} [${name}] completed`);
      } catch (err) {
        this.logger.error(`[${name}] failed:`, this.serializeError(err));
        break;
      }
      console.log('\n');
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