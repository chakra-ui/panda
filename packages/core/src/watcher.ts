import { filespy } from 'filespy';
import { error, createDebugger } from '@css-panda/logger';

type WatcherOptions = {
  ignore?: string[];
  cwd: string;
};

const debug = createDebugger('file:watcher');

export function createWatcher(files: string[], options: WatcherOptions) {
  const { ignore, cwd = process.cwd() } = options;

  debug('files: %o', files);

  const watcher = filespy(cwd, {
    only: files,
    skip: ignore,
  });

  process.once('SIGINT', async () => {
    await watcher.close();
  });

  return watcher;
}

export function onProcessExceptions() {
  process.on('unhandledRejection', (reason) => {
    error(reason);
  });
  process.on('uncaughtException', (err) => {
    error(err);
  });
}
