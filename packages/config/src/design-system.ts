import {
  outdirBasename,
  type CodegenOverlay,
  type DesignSystemManifest,
  type ImportMapInput,
  type ImportMapOption,
} from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createConfigDiagnostic, createConfigError, PandaError } from './error'
import { tryResolveFrom } from './resolve'
import { ensureConfigObject, errorMessage, type ExtendableConfig } from './shared'

export interface ResolvedDesignSystem {
  name: string
  specifier: string
  manifest: DesignSystemManifest
  manifestPath: string
  buildInfoPath: string
  files: string[]
  tokenPaths: string[]
  recipeNames: string[]
  patternNames: string[]
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

export interface DesignSystemMetadata {
  designSystem?: ResolvedDesignSystem[]
  userRecipeNames?: string[]
  userPatternNames?: string[]
}

export function buildCodegenOverlay(metadata: DesignSystemMetadata | undefined): CodegenOverlay | undefined {
  const chain = metadata?.designSystem
  if (!chain || chain.length !== 1) return undefined

  const [ds] = chain
  const appRecipes = new Set(metadata?.userRecipeNames ?? [])
  const appPatterns = new Set(metadata?.userPatternNames ?? [])

  return {
    ...overlayRoots(ds),
    ownedRecipes: ds.recipeNames.filter((name) => !appRecipes.has(name)),
    ownedPatterns: ds.patternNames.filter((name) => !appPatterns.has(name)),
  }
}

export interface DesignSystemArtifactConflict {
  name: string
  recipes: string[]
  patterns: string[]
}

export function collectArtifactConflicts(metadata: DesignSystemMetadata | undefined): DesignSystemArtifactConflict[] {
  const appRecipes = new Set(metadata?.userRecipeNames ?? [])
  const appPatterns = new Set(metadata?.userPatternNames ?? [])
  return (metadata?.designSystem ?? [])
    .map((ds) => ({
      name: ds.name,
      recipes: ds.recipeNames.filter((name) => appRecipes.has(name)),
      patterns: ds.patternNames.filter((name) => appPatterns.has(name)),
    }))
    .filter((entry) => entry.recipes.length > 0 || entry.patterns.length > 0)
}

function overlayRoots(ds: ResolvedDesignSystem): Pick<CodegenOverlay, 'jsx' | 'recipes' | 'patterns'> {
  const map = ds.importMap
  const root = (value: string | string[] | undefined, subpath: string): string => {
    const resolved = Array.isArray(value) ? value[0] : value
    return resolved ?? `${ds.specifier}/${subpath}`
  }
  return {
    jsx: root(map?.jsx, 'jsx'),
    recipes: root(map?.recipes, 'recipes'),
    patterns: root(map?.patterns, 'patterns'),
  }
}

function resolveManifestPath(spec: string, fromDir: string): string | undefined {
  try {
    return tryResolveFrom(`${spec}/panda.lib.json`, fromDir)
  } catch (error) {
    const message = `Failed to resolve designSystem ${JSON.stringify(spec)} from ${JSON.stringify(fromDir)}: ${errorMessage(error)}`
    throw createConfigError(message, [createConfigDiagnostic('design_system_resolve_failed', message)])
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
    throw invalidManifestError(spec, 'preset')
  }
  if (typeof manifest.buildInfo !== 'string') {
    throw invalidManifestError(spec, 'buildInfo')
  }

  const presetPath = resolve(dirname(manifestPath), manifest.preset)
  const buildInfoPath = resolve(dirname(manifestPath), manifest.buildInfo)
  deps.add(presetPath)
  deps.add(buildInfoPath)

  let preset: ExtendableConfig
  try {
    const mod = await import(presetImportUrl(presetPath))
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
        tokenPaths: [],
        recipeNames: [],
        patternNames: [],
        ...(manifest.importMap ? { importMap: manifest.importMap } : {}),
      },
    },
  }
}

function presetImportUrl(path: string): string {
  const url = pathToFileURL(path)
  url.searchParams.set('mtime', String(statSync(path).mtimeMs))
  return url.href
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
  const message = `designSystem ${JSON.stringify(spec)} could not be resolved. Install it, or — if it isn't a Panda design system — build it with \`panda lib\`.`
  return createConfigError(message, [
    createConfigDiagnostic('design_system_manifest_not_found', message, [
      `Install ${JSON.stringify(spec)}, or build it with \`panda lib\` if it is a Panda design system.`,
    ]),
  ])
}

function parentNotResolvedError(child: string, parent: string): PandaError {
  const message = `designSystem ${JSON.stringify(child)} extends ${JSON.stringify(parent)}, which isn't installed alongside it. Install it where ${JSON.stringify(child)} can resolve it, or rebuild that library with \`panda lib\`.`
  return createConfigError(message, [
    createConfigDiagnostic('design_system_parent_not_found', message, [
      `Install ${JSON.stringify(parent)} where ${JSON.stringify(child)} can resolve it, or rebuild ${JSON.stringify(child)} with \`panda lib\`.`,
    ]),
  ])
}

function cycleError(cycle: string[]): PandaError {
  const message = `Design-system cycle: ${cycle.join(' → ')}. A design system can't depend on itself.`
  return createConfigError(message, [createConfigDiagnostic('design_system_cycle', message)])
}

function invalidManifestError(spec: string, field: string): PandaError {
  const message = `${JSON.stringify(spec)} manifest is missing a "${field}" entry.`
  return createConfigError(message, [
    createConfigDiagnostic('design_system_manifest_invalid', message, [
      `Rebuild ${JSON.stringify(spec)} with \`panda lib\`.`,
    ]),
  ])
}
