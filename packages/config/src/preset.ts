import type { Config, UserConfig } from '@pandacss/types'
import { normalize, relative } from 'node:path'
import { bundleConfig } from './bundle'
import { PandaError } from './error'
import { configResolvedUtils } from './hook-utils'
import { collectPluginHookHandlers, normalizeHook, type PluginHookEntry } from './hooks'
import type { ConfigSources } from './sources'
import { mergeConfigs, mergeConfigsWithSources, type SourcedConfig } from './merge'
import { isPlainObject, type ExtendableConfig } from './shared'

type PresetEntry = NonNullable<Config['presets']>[number]
type ConfigSource = SourcedConfig['source']

interface CollectContext {
  cwd: string
  configs: ExtendableConfig[]
  sourcedConfigs?: SourcedConfig[]
  dependencies: Set<string>
  presetResolvedHooks: Array<PluginHookEntry<'preset:resolved'>>
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
  preserveRuntimeHooks?: boolean
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
    presetResolvedHooks: [],
    ...(options.trackSources ? { sourcedConfigs: [] } : {}),
  }

  const rootSource: ConfigSource = { kind: 'config' }
  if (options.configFile) rootSource.file = normalize(relative(cwd, options.configFile))

  await collectConfigs(config, rootSource, ctx, new WeakSet())

  if (ctx.sourcedConfigs) {
    const merged = mergeConfigsWithSources(ctx.sourcedConfigs)
    if (options.preserveRuntimeHooks) attachRuntimeHooks(merged.config, ctx.configs)
    return {
      config: merged.config as UserConfig,
      dependencies: Array.from(ctx.dependencies),
      metadata: { sources: merged.sources },
    }
  }

  return {
    config: (options.preserveRuntimeHooks
      ? attachRuntimeHooks(mergeConfigs(ctx.configs), ctx.configs)
      : mergeConfigs(ctx.configs)) as UserConfig,
    dependencies: Array.from(ctx.dependencies),
  }
}

function attachRuntimeHooks(config: ExtendableConfig, configs: ExtendableConfig[]): ExtendableConfig {
  const plugins = configs.flatMap((item) => {
    if ('hooks' in item && item.hooks != null) {
      throw new PandaError(
        'CONFIG_ERROR',
        '💥 `config.hooks` was removed in v2. Use `plugins: [{ name: "local", hooks: { ... } }]` instead.',
      )
    }
    return [...(item.plugins ?? []), ...(item.extend?.plugins ?? [])]
  })

  for (const plugin of plugins) {
    if (!isPlainObject(plugin) || typeof plugin.name !== 'string' || plugin.name.length === 0) {
      throw new PandaError(
        'CONFIG_ERROR',
        '💥 Every plugin in `config.plugins` must be an object with a non-empty `name`.',
      )
    }
  }

  if (plugins.length > 0) {
    config.plugins = plugins
  }

  return config
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
  const hookCount = ctx.presetResolvedHooks.length
  ctx.presetResolvedHooks.push(...collectPresetResolvedHooks(config))

  for (const preset of config.presets ?? []) {
    const resolved = await resolvePreset(preset, ctx.cwd)
    resolved.dependencies.forEach((dependency) => ctx.dependencies.add(dependency))
    const config = await runPresetResolvedHooks(resolved.config, resolved.source, ctx.presetResolvedHooks)
    await collectConfigs(config, resolved.source, ctx, active)
  }

  ctx.configs.push(config)
  ctx.sourcedConfigs?.push({ config, source })
  ctx.presetResolvedHooks.length = hookCount
  active.delete(config)
}

function collectPresetResolvedHooks(config: ExtendableConfig): Array<PluginHookEntry<'preset:resolved'>> {
  return collectPluginHookHandlers(config as UserConfig, 'preset:resolved')
}

async function runPresetResolvedHooks(
  preset: ExtendableConfig,
  source: ConfigSource,
  hooks: Array<PluginHookEntry<'preset:resolved'>>,
): Promise<ExtendableConfig> {
  let current = preset
  const name = source.name ?? source.specifier ?? presetName(current) ?? 'unknown-preset'

  for (const entry of hooks) {
    const hook = normalizeHook(entry.value, 'preset:resolved')
    const next = await hook.handler({ preset: current as Config, name, utils: configResolvedUtils })
    if (next !== undefined) {
      current = ensureConfigObject(next, name)
    }
  }

  return current
}

async function resolvePreset(preset: PresetEntry, cwd: string) {
  if (typeof preset === 'string') {
    try {
      const result = await bundleConfig<ExtendableConfig>(preset, cwd)
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
