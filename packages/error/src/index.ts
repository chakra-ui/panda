export class PandaError extends Error {
  readonly code: string;
  readonly hint?: string;

  constructor(code: string, message: string, opts?: { hint?: string }) {
    super(message);
    this.code = `ERR_PANDA_${code}`;
    this.hint = opts?.hint;
  }
}

export class TokenError extends PandaError {
  constructor(message: string) {
    super('INVALID_TOKEN', message);
  }
}

export class ConfigNotFoundError extends PandaError {
  constructor(options: { configPath?: string; cwd: string }) {
    const { configPath, cwd } = options;
    const message = configPath
      ? `Couldn't find ${configPath}`
      : `Could not find panda.config.ts or panda.config.js in ${cwd}`;
    super('NO_CONFIG_FOUND', message);
  }
}

export class ConfigError extends PandaError {
  constructor(options: {
    readonly configPath: string;
    readonly error: unknown;
  }) {
    const { configPath, error } = options;
    super('CONFIG_ERROR', `ConfigReadError (${configPath}): ${error}`);
  }
}
