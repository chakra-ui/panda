export interface PandaLintSettings {
  configPath?: string
  cwd: string
  strictDiagnostics: boolean
}

export interface RuleContextLike {
  cwd?: string
  settings?: Record<string, unknown>
}

interface RawPandaSettings {
  configPath?: unknown
  cwd?: unknown
  strictDiagnostics?: unknown
}

export function resolvePandaSettings(context: RuleContextLike): PandaLintSettings {
  const settings = context.settings ?? {}
  const panda = isObject(settings.panda) ? (settings.panda as RawPandaSettings) : {}
  const migrationConfigPath = settings['@pandacss/configPath']

  return {
    configPath: stringSetting(panda.configPath) ?? stringSetting(migrationConfigPath),
    cwd: stringSetting(panda.cwd) ?? context.cwd ?? process.cwd(),
    strictDiagnostics: panda.strictDiagnostics === true,
  }
}

function stringSetting(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
