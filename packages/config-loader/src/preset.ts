import type { Config, UserConfig } from '@pandacss/types'
import { normalize, relative } from 'node:path'
import { bundle } from './bundle'
import { PandaError } from './error'
import type { ConfigSources } from './sources'
import {
  isPlainObject,
  mergeConfigs,
  mergeConfigsWithSources,
  type ExtendableConfig,
  type SourcedConfig,
} from './shared'

type PresetEntry = NonNullable<Config['presets']>[number]
type ConfigSource = SourcedConfig['source']

interface CollectContext {
  cwd: string
  configs: ExtendableConfig[]
  sourcedConfigs?: SourcedConfig[]
  dependencies: Set<string>
}

export interface ResolveAuthoredPresetsResult {
  config: UserConfig
  dependencies: string[]
  metadata?: {
    sources?: ConfigSources
  }
}

export interface ResolveAuthoredPresetsOptions {
  trackSources?: boolean
  configFile?: string
}

export async function resolveAuthoredPresets(
  config: ExtendableConfig,
  cwd: string,
  options: ResolveAuthoredPresetsOptions = {},
): Promise<ResolveAuthoredPresetsResult> {
  const ctx: CollectContext = {
    cwd,
    configs: [],
    dependencies: new Set<string>(),
    ...(options.trackSources ? { sourcedConfigs: [] } : {}),
  }

  const rootSource: ConfigSource = { kind: 'config' }
  if (options.configFile) rootSource.file = normalize(relative(cwd, options.configFile))

  await collectConfigs(config, rootSource, ctx, new WeakSet())

  if (ctx.sourcedConfigs) {
    const merged = mergeConfigsWithSources(ctx.sourcedConfigs)
    return {
      config: merged.config as UserConfig,
      dependencies: Array.from(ctx.dependencies),
      metadata: { sources: merged.sources },
    }
  }

  return {
    config: mergeConfigs(ctx.configs) as UserConfig,
    dependencies: Array.from(ctx.dependencies),
  }
}

async function collectConfigs(
  config: ExtendableConfig,
  source: ConfigSource,
  ctx: CollectContext,
  active: WeakSet<object>,
) {
  if (active.has(config)) {
    throw new PandaError('CONFIG_ERROR', '💥 Circular preset dependency detected.')
  }

  active.add(config)

  for (const preset of config.presets ?? []) {
    const resolved = await resolvePreset(preset, ctx.cwd)
    resolved.dependencies.forEach((dependency) => ctx.dependencies.add(dependency))
    await collectConfigs(resolved.config, resolved.source, ctx, active)
  }

  ctx.configs.push(config)
  ctx.sourcedConfigs?.push({ config, source })
  active.delete(config)
}

async function resolvePreset(preset: PresetEntry, cwd: string) {
  if (typeof preset === 'string') {
    try {
      const result = await bundle<ExtendableConfig>(preset, cwd)
      return {
        config: ensureConfigObject(result.config, preset),
        dependencies: result.dependencies,
        source: presetSource(result.config, preset, result.dependencies[0]),
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
      source: presetSource(config),
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

function presetName(config: unknown) {
  return isPlainObject(config) && typeof config.name === 'string' ? config.name : undefined
}

function presetSource(config: unknown, specifier?: string, file?: string): ConfigSource {
  const source: ConfigSource = { kind: 'preset' }
  const name = presetName(config)
  if (name) source.name = name
  if (specifier) source.specifier = specifier
  if (file) source.file = file
  return source
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
