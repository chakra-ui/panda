import { omit, pick, traverse } from '@pandacss/shared'
import type { Config, LibManifest, LoadConfigResult, PandaHooks, Preset } from '@pandacss/types'
import { realpathSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { bundle } from './bundle-config'
import { readLibManifest } from './lib-manifest'
import { mergeConfigs } from './merge-config'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

const hookUtils = {
  omit,
  pick,
  traverse,
}

/**
 * Recursively merge all presets into a single config (depth-first using stack).
 * The input config is not mutated — `panda lib --watch` reuses the same config
 * across rebuilds and would accumulate prepended designSystem presets otherwise.
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string, hooks?: Partial<PandaHooks>) {
  const root: ExtendableConfig = { ...config }

  if (root.designSystem) {
    // Walk the designSystem chain via each lib's manifest. Each manifest may declare
    // its own `designSystem` (set when that lib was built); the chain stops at the lib
    // that has no parent. We collect parents first → child last so the merge order
    // matches user expectation (parent tokens get overridden by child tokens).
    const chainPresets: Preset[] = []
    const chainImportMaps: LibManifest['importMap'][] = []
    // Track realpaths of visited manifests, not specifier strings — under pnpm
    // a single manifest can be reached via multiple aliases (e.g. `@scope/lib`
    // and `lib`); a string-keyed visited set would miss those cycles.
    const visited = new Set<string>()
    let currentName: string | undefined = root.designSystem
    // Each level's manifest is resolved relative to the PREVIOUS manifest's dir,
    // not the initial consumer cwd — so transitive parents (chain-N → chain-(N-1)
    // → chain-(N-2)) resolve even when the consumer only depends on chain-N.
    let resolutionCwd = cwd

    while (currentName) {
      const { manifest, manifestPath } = readLibManifest(currentName, resolutionCwd)

      let manifestKey: string
      try {
        manifestKey = realpathSync(manifestPath)
      } catch {
        manifestKey = manifestPath
      }
      if (visited.has(manifestKey)) {
        throw new Error(`designSystem chain has a cycle through '${currentName}' (resolved to '${manifestKey}').`)
      }
      visited.add(manifestKey)

      const presetPath = isAbsolute(manifest.preset) ? manifest.preset : join(dirname(manifestPath), manifest.preset)
      // Resolve the parent preset's externals against THIS lib's directory, not
      // the initial consumer cwd — under pnpm, chain-(N-1) may not be hoisted to
      // the consumer's node_modules but is always present in chain-N's.
      const presetModule = await bundle(presetPath, dirname(manifestPath))
      const exportName = manifest.presetExport ?? 'default'

      const moduleObj = (presetModule.config ?? presetModule) as Record<string, unknown>
      let levelPreset = moduleObj[exportName] as Preset | undefined

      if (!levelPreset && exportName === 'default') {
        levelPreset = moduleObj as unknown as Preset
      }

      if (!levelPreset) {
        throw new Error(
          `designSystem '${currentName}': preset file does not export '${exportName}'. ` +
            `Check the manifest's 'presetExport' field or that the preset file has a default export.`,
        )
      }

      chainPresets.unshift(levelPreset)
      chainImportMaps.unshift(manifest.importMap)
      currentName = manifest.designSystem
      resolutionCwd = dirname(manifestPath)
    }

    // Prepend the full chain (parents first) ahead of any user-declared presets.
    root.presets = [...chainPresets, ...(root.presets ?? [])]

    const consumerImportMap = root.importMap
    if (consumerImportMap === undefined) {
      // Always return an array so downstream code never branches on shape.
      root.importMap = chainImportMaps
    } else if (Array.isArray(consumerImportMap)) {
      root.importMap = [...consumerImportMap, ...chainImportMaps]
    } else {
      root.importMap = [consumerImportMap, ...chainImportMaps]
    }
  }

  const stack: ExtendableConfig[] = [root]
  const configs: ExtendableConfig[] = []

  // String specifiers dedup by specifier; object presets dedup by identity.
  // Two distinct presets sharing a `name` both flow through.
  const seenStrings = new Set<string>()
  const seenRefs = new WeakSet<object>()

  while (stack.length > 0) {
    const current = stack.pop()!

    const subPresets = current.presets ?? []
    for (const subPreset of subPresets) {
      let presetConfig: ExtendableConfig
      let presetName: string

      if (typeof subPreset === 'string') {
        if (seenStrings.has(subPreset)) continue
        seenStrings.add(subPreset)
        const presetModule = await bundle(subPreset, cwd)
        presetConfig = presetModule.config
        presetName = subPreset
      } else {
        presetConfig = await subPreset
        presetName = (presetConfig as Preset).name || 'unknown-preset'
      }

      if (typeof presetConfig === 'object' && presetConfig !== null) {
        if (seenRefs.has(presetConfig)) continue
        seenRefs.add(presetConfig)
      }

      if (hooks?.['preset:resolved']) {
        const resolvedPreset = await hooks['preset:resolved']({
          preset: presetConfig as unknown as LoadConfigResult['config'],
          name: presetName,
          utils: hookUtils,
        })

        if (resolvedPreset !== undefined) {
          presetConfig = resolvedPreset as ExtendableConfig
        }
      }

      stack.push(presetConfig)
    }

    configs.unshift(current)
  }

  const merged = mergeConfigs(configs) as Config

  // Keep the resolved presets so we can find the origin of a token
  merged.presets = configs.slice(0, -1) as Preset[]

  return merged
}
