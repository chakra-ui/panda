export class PandaError extends Error {
  readonly code: string
  readonly hint?: string

  constructor(code: string, message: string, opts?: { hint?: string }) {
    super(message)
    this.code = `ERR_PANDA_${code}`
    this.hint = opts?.hint
  }
}

export class TokenError extends PandaError {
  constructor(message: string) {
    super('INVALID_TOKEN', message)
  }
}

export class ConfigNotFoundError extends PandaError {
  constructor() {
    const message = `Cannot find config file: panda.config.ts or panda.config.js/cjs/mjs/mts/cts. Did you forget to run \`panda init\`?`
    super('NO_CONFIG', message)
  }
}

export class ConfigError extends PandaError {
  constructor(message: string) {
    super('CONFIG_ERROR', message)
  }
}

export class NotFoundError extends PandaError {
  constructor({ name, type }: { name: string; type: string }) {
    super('NOT_FOUND', `${type} not found: \`${name}\``)
  }
}

export class ConditionError extends PandaError {
  constructor(message: string) {
    super('CONDITION', message)
  }
}
