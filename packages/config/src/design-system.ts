import {
  outdirBasename,
  type DesignSystemManifest,
  type ImportMapInput,
  type ImportMapOption,
} from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PandaError } from './error'
import { ensureConfigObject, errorMessage, type ExtendableConfig } from './shared'

export interface ResolvedDesignSystem {
  name: string
  manifest: DesignSystemManifest
  manifestPath: string
  buildInfoPath: string
  files: string[]
  importMap?: DesignSystemManifest['importMap']
}

export async function loadDesignSystemPreset(
  spec: string,
  cwd: string,
  deps: Set<string>,
): Promise<{ preset: ExtendableConfig; info: ResolvedDesignSystem }> {
  const require = createRequire(resolve(cwd, 'noop.js'))

  let manifestPath: string
  try {
    manifestPath = require.resolve(`${spec}/panda.lib.json`, { paths: [cwd] })
  } catch {
    throw new PandaError(
      'CONFIG_ERROR',
      `💥 designSystem ${JSON.stringify(spec)} could not be resolved. Install it, or — if it isn't a Panda design system — build it with \`panda lib\`.`,
    )
  }
  deps.add(manifestPath)

  let manifest: DesignSystemManifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as DesignSystemManifest
  } catch (error) {
    throw new PandaError('CONFIG_ERROR', `💥 Failed to read ${JSON.stringify(manifestPath)}: ${errorMessage(error)}`)
  }
  if (typeof manifest.preset !== 'string') {
    throw new PandaError('CONFIG_ERROR', `💥 ${JSON.stringify(spec)} manifest is missing a "preset" entry.`)
  }
  if (typeof manifest.buildInfo !== 'string') {
    throw new PandaError('CONFIG_ERROR', `💥 ${JSON.stringify(spec)} manifest is missing a "buildInfo" entry.`)
  }
  if (typeof manifest.designSystem === 'string' && manifest.designSystem.length > 0) {
    throw new PandaError(
      'CONFIG_ERROR',
      `💥 designSystem ${JSON.stringify(spec)} extends ${JSON.stringify(manifest.designSystem)}, but nested design systems are not supported yet.`,
    )
  }

  const presetPath = resolve(dirname(manifestPath), manifest.preset)
  const buildInfoPath = resolve(dirname(manifestPath), manifest.buildInfo)
  deps.add(presetPath)
  deps.add(buildInfoPath)

  let preset: ExtendableConfig
  try {
    const mod = await import(pathToFileURL(presetPath).href)
    preset = ensureConfigObject(mod.default ?? mod, manifest.name ?? spec)
  } catch (error) {
    if (error instanceof PandaError) throw error
    throw new PandaError(
      'CONFIG_ERROR',
      `💥 Failed to load preset for designSystem ${JSON.stringify(spec)}: ${errorMessage(error)}`,
    )
  }

  return {
    preset,
    info: {
      name: manifest.name ?? spec,
      manifest,
      manifestPath,
      buildInfoPath,
      files: manifest.files ?? [],
      ...(manifest.importMap ? { importMap: manifest.importMap } : {}),
    },
  }
}

export function withDesignSystemImportMap(config: UserConfig, spec: string, info: ResolvedDesignSystem): UserConfig {
  const existing: ImportMapOption[] =
    config.importMap === undefined ? [] : Array.isArray(config.importMap) ? config.importMap : [config.importMap]
  const dsRoot: ImportMapOption = info.importMap ? designSystemImportMap(info.importMap, spec) : spec
  return { ...config, importMap: [dsRoot, outdirBasename(config.outdir ?? 'styled-system'), ...existing] }
}

function designSystemImportMap(map: NonNullable<DesignSystemManifest['importMap']>, spec: string): ImportMapInput {
  return {
    css: map.css ?? `${spec}/css`,
    recipes: map.recipes ?? `${spec}/recipes`,
    patterns: map.patterns ?? `${spec}/patterns`,
    jsx: map.jsx ?? `${spec}/jsx`,
    tokens: map.tokens ?? `${spec}/tokens`,
  }
}
