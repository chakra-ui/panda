import {
  outdirBasename,
  type DesignSystemManifest,
  type ImportMapInput,
  type ImportMapOption,
} from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PandaError } from './error'
import { tryResolveFrom } from './resolve'
import { ensureConfigObject, errorMessage, type ExtendableConfig } from './shared'
import { collectTokenPaths } from './token-paths'

export interface ResolvedDesignSystem {
  name: string
  specifier: string
  manifest: DesignSystemManifest
  manifestPath: string
  buildInfoPath: string
  files: string[]
  tokenPaths: string[]
  importMap?: DesignSystemManifest['importMap']
}

export interface DesignSystemLevel {
  preset: ExtendableConfig
  info: ResolvedDesignSystem
}

export async function loadDesignSystemChain(
  spec: string,
  cwd: string,
  deps: Set<string>,
): Promise<DesignSystemLevel[]> {
  const levels: DesignSystemLevel[] = []
  const seenAt = new Map<string, number>()

  let currentSpec = spec
  let fromDir = cwd
  let declaredBy: string | undefined

  while (true) {
    const manifestPath = resolveManifestPath(currentSpec, fromDir)
    if (manifestPath === undefined) {
      throw declaredBy === undefined ? notResolvedError(currentSpec) : parentNotResolvedError(declaredBy, currentSpec)
    }
    const seen = seenAt.get(manifestPath)
    if (seen !== undefined) {
      throw cycleError([...levels.slice(seen).map((level) => level.info.name), levels[seen].info.name])
    }
    seenAt.set(manifestPath, levels.length)
    deps.add(manifestPath)

    const { level, parent } = await loadManifestLevel(currentSpec, manifestPath, deps)
    levels.push(level)

    if (parent === undefined) break
    declaredBy = level.info.name
    fromDir = dirname(manifestPath)
    currentSpec = parent
  }

  return levels.reverse()
}

export function withDesignSystemImportMap(config: UserConfig, infos: ResolvedDesignSystem[]): UserConfig {
  const existing: ImportMapOption[] =
    config.importMap === undefined ? [] : Array.isArray(config.importMap) ? config.importMap : [config.importMap]
  const roots: ImportMapOption[] = infos.map((info) =>
    info.importMap ? designSystemImportMap(info.importMap, info.specifier) : info.specifier,
  )
  return { ...config, importMap: [...roots, outdirBasename(config.outdir ?? 'styled-system'), ...existing] }
}

function resolveManifestPath(spec: string, fromDir: string): string | undefined {
  try {
    return tryResolveFrom(`${spec}/panda.lib.json`, fromDir)
  } catch (error) {
    throw new PandaError(
      'CONFIG_ERROR',
      `💥 Failed to resolve designSystem ${JSON.stringify(spec)} from ${JSON.stringify(fromDir)}: ${errorMessage(error)}`,
    )
  }
}

async function loadManifestLevel(
  spec: string,
  manifestPath: string,
  deps: Set<string>,
): Promise<{ level: DesignSystemLevel; parent: string | undefined }> {
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

  const parent =
    typeof manifest.designSystem === 'string' && manifest.designSystem.length > 0 ? manifest.designSystem : undefined

  return {
    parent,
    level: {
      preset,
      info: {
        name: manifest.name ?? spec,
        specifier: spec,
        manifest,
        manifestPath,
        buildInfoPath,
        files: manifest.files ?? [],
        tokenPaths: collectTokenPaths(preset),
        ...(manifest.importMap ? { importMap: manifest.importMap } : {}),
      },
    },
  }
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

function notResolvedError(spec: string): PandaError {
  return new PandaError(
    'CONFIG_ERROR',
    `💥 designSystem ${JSON.stringify(spec)} could not be resolved. Install it, or — if it isn't a Panda design system — build it with \`panda lib\`.`,
  )
}

function parentNotResolvedError(child: string, parent: string): PandaError {
  return new PandaError(
    'CONFIG_ERROR',
    `💥 designSystem ${JSON.stringify(child)} extends ${JSON.stringify(parent)}, which isn't installed alongside it. Install it where ${JSON.stringify(child)} can resolve it, or rebuild that library with \`panda lib\`.`,
  )
}

function cycleError(cycle: string[]): PandaError {
  return new PandaError(
    'CONFIG_ERROR',
    `💥 Design-system cycle: ${cycle.join(' → ')}. A design system can't depend on itself.`,
  )
}
