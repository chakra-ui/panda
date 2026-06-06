import type { Config, UserConfig } from '@pandacss/types'
import { bundle } from './bundle'
import { PandaError } from './error'
import { isPlainObject, mergeConfigs, type ExtendableConfig } from './shared'

type PresetEntry = NonNullable<Config['presets']>[number]

export interface ResolveAuthoredPresetsResult {
  config: UserConfig
  dependencies: string[]
}

export async function resolveAuthoredPresets(
  config: ExtendableConfig,
  cwd: string,
): Promise<ResolveAuthoredPresetsResult> {
  const configs: ExtendableConfig[] = []
  const dependencies = new Set<string>()

  await collectConfigs(config, cwd, configs, dependencies, new WeakSet())

  return {
    config: mergeConfigs(configs) as UserConfig,
    dependencies: Array.from(dependencies),
  }
}

async function collectConfigs(
  config: ExtendableConfig,
  cwd: string,
  configs: ExtendableConfig[],
  dependencies: Set<string>,
  active: WeakSet<object>,
) {
  if (active.has(config)) {
    throw new PandaError('CONFIG_ERROR', '💥 Circular preset dependency detected.')
  }

  active.add(config)

  for (const preset of config.presets ?? []) {
    const resolved = await resolvePreset(preset, cwd)
    resolved.dependencies.forEach((dependency) => dependencies.add(dependency))
    await collectConfigs(resolved.config, cwd, configs, dependencies, active)
  }

  configs.push(config)
  active.delete(config)
}

async function resolvePreset(preset: PresetEntry, cwd: string) {
  if (typeof preset === 'string') {
    try {
      const result = await bundle<ExtendableConfig>(preset, cwd)
      return {
        config: ensureConfigObject(result.config, preset),
        dependencies: result.dependencies,
      }
    } catch (error) {
      if (error instanceof PandaError) throw error
      throw new PandaError(
        'CONFIG_ERROR',
        `💥 Failed to resolve preset ${JSON.stringify(preset)}: ${errorMessage(error)}`,
      )
    }
  }

  try {
    const config = await preset
    return {
      config: ensureConfigObject(config, (config as any)?.name ?? 'unknown-preset'),
      dependencies: [],
    }
  } catch (error) {
    if (error instanceof PandaError) throw error
    throw new PandaError('CONFIG_ERROR', `💥 Failed to resolve preset "unknown-preset": ${errorMessage(error)}`)
  }
}

function ensureConfigObject(config: unknown, name: string): ExtendableConfig {
  if (isPlainObject(config)) return config as ExtendableConfig
  throw new PandaError('CONFIG_ERROR', `💥 Preset ${JSON.stringify(name)} must resolve to an object.`)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
