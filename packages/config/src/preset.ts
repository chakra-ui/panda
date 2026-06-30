import type { Config, UserConfig } from '@pandacss/types'
import { normalize, relative } from 'node:path'
import { bundleConfig } from './bundle'
import {
  loadDesignSystemChain,
  withDesignSystemImportMap,
  type DesignSystemLevel,
  type ResolvedDesignSystem,
} from './design-system'
import { createConfigDiagnostic, createConfigError, PandaError } from './error'
import { attachRuntimeHooks, configResolvedUtils } from './hook-utils'
import { collectPluginHookHandlers, normalizeHook, type PluginHookEntry } from './hooks'
import type { ConfigSources } from './sources'
import { expandSmartInclude } from './smart-include'
import { collectTokenPaths } from './token-paths'
import { mergeConfigs, mergeConfigsWithSources, type SourcedConfig } from './merge'
import { ensureConfigObject, errorMessage, isPlainObject, type ExtendableConfig } from './shared'

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
    designSystem?: ResolvedDesignSystem[]
    userTokenPaths?: string[]
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

  const designSystem = (config as UserConfig).designSystem
  let dsChain: DesignSystemLevel[] = []
  if (typeof designSystem === 'string' && designSystem.length > 0) {
    dsChain = await loadDesignSystemChain(designSystem, cwd, ctx.dependencies)
    for (const level of dsChain) {
      await collectConfigs(level.preset, { kind: 'preset', specifier: level.info.name }, ctx, new WeakSet())
    }
  }

  await collectConfigs(config, rootSource, ctx, new WeakSet())

  const dsInfos = dsChain.map((level) => level.info)
  const finalize = (resolved: UserConfig): UserConfig => {
    const withImportMap = dsInfos.length > 0 ? withDesignSystemImportMap(resolved, dsInfos) : resolved
    return expandSmartInclude(withImportMap, cwd, ctx.dependencies)
  }
  const dsMetadata =
    dsInfos.length > 0 ? { designSystem: dsInfos, userTokenPaths: collectTokenPaths(config) } : undefined

  if (ctx.sourcedConfigs) {
    const merged = mergeConfigsWithSources(ctx.sourcedConfigs)
    if (options.preserveRuntimeHooks) attachRuntimeHooks(merged.config, ctx.configs)
    return {
      config: finalize(merged.config as UserConfig),
      dependencies: Array.from(ctx.dependencies),
      metadata: { sources: merged.sources, ...dsMetadata },
    }
  }

  return {
    config: finalize(
      (options.preserveRuntimeHooks
        ? attachRuntimeHooks(mergeConfigs(ctx.configs), ctx.configs)
        : mergeConfigs(ctx.configs)) as UserConfig,
    ),
    dependencies: Array.from(ctx.dependencies),
    ...(dsMetadata ? { metadata: dsMetadata } : {}),
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
      throw presetResolutionError(JSON.stringify(preset), error)
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
    throw presetResolutionError('"unknown-preset"', error)
  }
}

function presetResolutionError(name: string, error: unknown): PandaError {
  const message = `Failed to resolve preset ${name}: ${errorMessage(error)}`
  return createConfigError(message, [createConfigDiagnostic('preset_resolution_failed', message)])
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
