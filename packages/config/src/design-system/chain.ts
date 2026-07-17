import {
  outdirBasename,
  type CodegenOverlay,
  type Diagnostic,
  type DesignSystemManifest,
  type ImportMapInput,
  type ImportMapOption,
} from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createConfigDiagnostic, createConfigError, PandaError } from '../error'
import { nearestPackageJson } from './package'
import { resolveFrom, type ResolveOutcome } from '../resolve'
import { ensureConfigObject, errorMessage, isPlainObject, type ExtendableConfig } from '../shared'

const SPECIFIER_PROTOCOL = /^([a-z][a-z0-9+.-]*):/i

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
  packageExports?: Record<string, unknown>
  optionMismatch?: string[]
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
  const seenNames = new Map<string, string>()

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

    const priorPath = seenNames.get(level.info.name)
    if (priorPath !== undefined && priorPath !== manifestPath) {
      throw duplicateNameError(level.info.name, priorPath, manifestPath)
    }
    seenNames.set(level.info.name, manifestPath)

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

export interface DesignSystemAppConfigKeys {
  conditions: boolean
  breakpoints: boolean
  utilities: boolean
  tokens: boolean
  globalOptionsMatchDs: boolean
}

export interface DesignSystemMetadata {
  designSystem?: ResolvedDesignSystem[]
  userRecipeNames?: string[]
  userPatternNames?: string[]
  appConfigKeys?: DesignSystemAppConfigKeys
}

export function buildCodegenOverlay(metadata: DesignSystemMetadata | undefined): CodegenOverlay | undefined {
  const chain = metadata?.designSystem
  if (!chain || chain.length !== 1) return undefined

  const [ds] = chain
  const appRecipes = new Set(metadata?.userRecipeNames ?? [])
  const appPatterns = new Set(metadata?.userPatternNames ?? [])

  const keys = metadata?.appConfigKeys
  const globalMatch = keys?.globalOptionsMatchDs ?? true
  const virtualizeUtils = globalMatch
  const virtualizeCss = globalMatch && !keys?.conditions && !keys?.breakpoints && !keys?.utilities && !keys?.tokens
  const virtualizeConditions = virtualizeCss

  return {
    ...overlayRoots(ds),
    ownedRecipes: ds.recipeNames.filter((name) => !appRecipes.has(name)),
    ownedPatterns: ds.patternNames.filter((name) => !appPatterns.has(name)),
    virtualizeUtils,
    virtualizeConditions,
    virtualizeCss,
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

export function collectExportMissingDiagnostics(metadata: DesignSystemMetadata | undefined): Diagnostic[] {
  const overlay = buildCodegenOverlay(metadata)
  if (!overlay) return []

  const [ds] = metadata!.designSystem!
  const required: string[] = []
  if (overlay.virtualizeUtils) required.push('./helpers')
  if (overlay.virtualizeConditions || overlay.virtualizeCss) required.push('./css/*')
  if (overlay.virtualizeCss) required.push('./css')
  if (overlay.ownedRecipes.length > 0) required.push('./recipes')
  if (overlay.ownedPatterns.length > 0) required.push('./patterns')

  return required
    .filter((subpath) => !hasExport(ds.packageExports, subpath))
    .map((subpath) => exportMissingDiagnostic(ds.name, subpath))
}

export function collectNameCollisionDiagnostics(metadata: DesignSystemMetadata | undefined): Diagnostic[] {
  const overlay = buildCodegenOverlay(metadata)
  if (!overlay) return []
  return [
    ...identCollisions('recipe', [...overlay.ownedRecipes, ...(metadata?.userRecipeNames ?? [])]),
    ...identCollisions('pattern', [...overlay.ownedPatterns, ...(metadata?.userPatternNames ?? [])]),
  ]
}

// Names that survive as distinct config keys but collapse to the same generated
// export identifier (`my-stack` and `my_stack` -> `my_stack`) would produce a
// duplicate/overwriting barrel export. Mirrors `pandacss_shared::js_ident`.
function jsIdent(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (/[A-Za-z0-9_$]/.test(ch)) {
      if (i === 0 && ch >= '0' && ch <= '9') out += '_'
      out += ch
    } else {
      out += '_'
    }
  }
  return out === '' ? '_' : out
}

function identCollisions(kind: 'recipe' | 'pattern', names: string[]): Diagnostic[] {
  const byIdent = new Map<string, Set<string>>()
  for (const name of names) {
    const ident = jsIdent(name)
    const set = byIdent.get(ident) ?? new Set<string>()
    set.add(name)
    byIdent.set(ident, set)
  }
  const collisions: Diagnostic[] = []
  for (const [ident, raw] of byIdent) {
    if (raw.size < 2) continue
    const list = [...raw].map((name) => JSON.stringify(name)).join(', ')
    const message = `${kind} names ${list} both generate the export ${JSON.stringify(ident)}; one would overwrite the other in the generated barrel. Rename one so they produce distinct identifiers.`
    collisions.push(createConfigDiagnostic('design_system_name_collision', message))
  }
  return collisions
}

function hasExport(packageExports: Record<string, unknown> | undefined, subpath: string): boolean {
  return packageExports != null && Object.prototype.hasOwnProperty.call(packageExports, subpath)
}

function exportMissingDiagnostic(dsName: string, subpath: string): Diagnostic {
  const message = `designSystem ${JSON.stringify(dsName)} doesn't export ${JSON.stringify(subpath)}, which this app's codegen needs. Rebuild it with \`panda lib\`.`
  return createConfigDiagnostic('design_system_export_missing', message, [
    `Rebuild ${JSON.stringify(dsName)} with \`panda lib\` to add the ${JSON.stringify(subpath)} export.`,
  ])
}

function overlayRoots(
  ds: ResolvedDesignSystem,
): Pick<CodegenOverlay, 'jsx' | 'recipes' | 'patterns' | 'css' | 'helpers'> {
  const map = ds.importMap
  const root = (value: string | string[] | undefined, subpath: string): string => {
    const resolved = Array.isArray(value) ? value[0] : value
    return resolved ?? `${ds.specifier}/${subpath}`
  }
  return {
    jsx: root(map?.jsx, 'jsx'),
    recipes: root(map?.recipes, 'recipes'),
    patterns: root(map?.patterns, 'patterns'),
    css: root(map?.css, 'css'),
    helpers: `${ds.specifier}/helpers`,
  }
}

function resolveManifestPath(spec: string, fromDir: string): string | undefined {
  const protocol = specifierProtocol(spec)
  if (protocol) throw unsupportedSpecifierError(spec, protocol)

  let outcome: ResolveOutcome
  try {
    outcome = resolveFrom(`${spec}/panda.lib.json`, fromDir)
  } catch (error) {
    const message = `Failed to resolve designSystem ${JSON.stringify(spec)} from ${JSON.stringify(fromDir)}: ${errorMessage(error)}`
    throw createConfigError(message, [createConfigDiagnostic('design_system_resolve_failed', message)])
  }
  if (outcome.kind === 'resolved') return outcome.path
  if (outcome.kind === 'not-exported') throw manifestNotExportedError(spec)
  return undefined
}

function manifestNotExportedError(spec: string): PandaError {
  const message = `designSystem ${JSON.stringify(spec)} is installed but doesn't expose \`./panda.lib.json\`. If it's a Panda design system, rebuild it with \`panda lib\`; otherwise it can't be consumed as a design system.`
  return createConfigError(message, [
    createConfigDiagnostic('design_system_manifest_not_exported', message, [
      `Rebuild ${JSON.stringify(spec)} with \`panda lib\`, or check its package.json \`exports\` includes \`./panda.lib.json\`.`,
    ]),
  ])
}

async function loadManifestLevel(
  spec: string,
  manifestPath: string,
  deps: Set<string>,
): Promise<{ level: DesignSystemLevel; parent: string | undefined }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    const message = `Failed to parse ${JSON.stringify(manifestPath)} as JSON: ${errorMessage(error)}. This file must be generated by \`panda lib\`, not hand-written or added to \`include\`.`
    throw createConfigError(message, [
      { ...createConfigDiagnostic('design_system_manifest_invalid', message), file: manifestPath },
    ])
  }
  const manifest = validateManifest(spec, manifestPath, parsed)

  const presetPath = resolve(dirname(manifestPath), manifest.preset)
  const buildInfoPath = resolve(dirname(manifestPath), manifest.buildInfo)
  deps.add(presetPath)
  deps.add(buildInfoPath)

  let preset: ExtendableConfig
  try {
    const mod = await import(presetImportUrl(presetPath))
    preset = ensureConfigObject('default' in mod ? mod.default : mod, manifest.name ?? spec)
  } catch (error) {
    if (error instanceof PandaError && error.diagnostics?.length) throw error
    const message = `Failed to load the preset for designSystem ${JSON.stringify(spec)} (${JSON.stringify(manifest.preset)}): ${errorMessage(error)}`
    throw createConfigError(message, [
      createConfigDiagnostic('design_system_preset_load_failed', message, [
        `Check that ${JSON.stringify(manifest.preset)} is valid and rebuild ${JSON.stringify(spec)} with \`panda lib\`.`,
      ]),
    ])
  }

  const parent =
    typeof manifest.designSystem === 'string' && manifest.designSystem.length > 0 ? manifest.designSystem : undefined
  const packageExports = readPackageExports(manifestPath)

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
        ...(packageExports ? { packageExports } : {}),
      },
    },
  }
}

function readPackageExports(manifestPath: string): Record<string, unknown> | undefined {
  try {
    const packageJsonPath = nearestPackageJson(dirname(manifestPath))
    if (packageJsonPath === undefined) return undefined
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { exports?: unknown }
    return isExportsMap(pkg.exports) ? pkg.exports : undefined
  } catch {
    return undefined
  }
}

function isExportsMap(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

const IMPORT_MAP_FIELDS = ['css', 'recipes', 'patterns', 'jsx', 'tokens'] as const

function validateManifest(spec: string, manifestPath: string, value: unknown): DesignSystemManifest {
  if (!isPlainObject(value)) {
    throw invalidManifestError(spec, manifestPath, ['must contain a JSON object'])
  }

  const issues: string[] = []
  requiredString(value, 'name', issues)
  requiredString(value, 'panda', issues)
  requiredString(value, 'preset', issues)
  requiredString(value, 'buildInfo', issues)

  if (!Number.isInteger(value.schemaVersion) || (value.schemaVersion as number) < 1) {
    issues.push('must contain a positive integer "schemaVersion" entry')
  }

  if (value.version !== undefined && typeof value.version !== 'string') {
    issues.push('has a "version" entry that must be a string')
  }

  if (value.designSystem !== undefined && !isNonEmptyString(value.designSystem)) {
    issues.push('has a "designSystem" entry that must be a non-empty string')
  }

  if (
    value.files !== undefined &&
    (!Array.isArray(value.files) || !value.files.every((file) => isNonEmptyString(file)))
  ) {
    issues.push('has a "files" entry that must be an array of non-empty strings')
  }

  if (value.importMap !== undefined) {
    if (!isPlainObject(value.importMap)) {
      issues.push('has an "importMap" entry that must be an object')
    } else {
      for (const field of IMPORT_MAP_FIELDS) {
        const entry = value.importMap[field]
        if (entry !== undefined && !isNonEmptyString(entry)) {
          issues.push(`has an "importMap.${field}" entry that must be a non-empty string`)
        }
      }
    }
  }

  if (issues.length > 0) {
    throw invalidManifestError(spec, manifestPath, issues)
  }

  return value as unknown as DesignSystemManifest
}

function requiredString(value: Record<string, unknown>, field: string, issues: string[]): void {
  if (!isNonEmptyString(value[field])) {
    issues.push(`is missing a "${field}" entry or it is empty`)
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
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

function invalidManifestError(spec: string, manifestPath: string, issues: string[]): PandaError {
  const message = `${JSON.stringify(spec)} manifest ${issues.join('; ')}.`
  return createConfigError(message, [
    {
      ...createConfigDiagnostic('design_system_manifest_invalid', message, [
        `Rebuild ${JSON.stringify(spec)} with \`panda lib\`.`,
      ]),
      file: manifestPath,
    },
  ])
}

function duplicateNameError(name: string, firstPath: string, secondPath: string): PandaError {
  const message = `Two different packages in the design-system chain are both named ${JSON.stringify(name)} (${JSON.stringify(firstPath)} and ${JSON.stringify(secondPath)}). Their styles would overwrite each other; give each package a unique name.`
  return createConfigError(message, [createConfigDiagnostic('design_system_duplicate_name', message)])
}

function specifierProtocol(spec: string): string | undefined {
  const match = spec.match(SPECIFIER_PROTOCOL)
  return match ? match[1] : undefined
}

function unsupportedSpecifierError(spec: string, protocol: string): PandaError {
  const message = `designSystem ${JSON.stringify(spec)} uses the "${protocol}:" protocol, which isn't supported. Use the published package name (e.g. "@acme/design-system") that resolves to its \`panda.lib.json\`.`
  return createConfigError(message, [createConfigDiagnostic('design_system_unsupported_specifier', message)])
}
