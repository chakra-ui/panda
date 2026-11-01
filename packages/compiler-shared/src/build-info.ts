import type {
  BuildInfoCompatibility,
  BuildInfoCreateOptions,
  BuildInfoArtifact,
  BuildInfoHydrateOptions,
  BuildInfoHydrateResult,
  BuildInfoNormalizeOptions,
  BuildInfoDesignSystemDependency,
  DesignSystemImport,
  DesignSystemImportInput,
} from './types'

/**
 * The flat build-info primitives every binding (native / wasm) exposes. The
 * ergonomic `compiler.buildInfo` namespace is built over these. The engine owns
 * the config fingerprint (stamped as `configFingerprint`), so the producer only
 * supplies the published `panda` range.
 */
export interface BuildInfoNative {
  serializeBuildInfo(panda: string, designSystemDependencies?: BuildInfoDesignSystemDependency[]): BuildInfoArtifact
  applyBuildInfo(name: string, buildInfo: BuildInfoArtifact, only?: string[]): boolean
  buildInfoSchemaVersion(): number
  configFingerprint(): string
}

export class BuildInfo {
  readonly #native: BuildInfoNative
  readonly schemaVersion: number
  readonly configFingerprint: string

  constructor(native: BuildInfoNative) {
    this.#native = native
    this.schemaVersion = native.buildInfoSchemaVersion()
    this.configFingerprint = native.configFingerprint()
  }

  create(options: BuildInfoCreateOptions): BuildInfoArtifact {
    return this.#native.serializeBuildInfo(options.panda, options.designSystemDependencies)
  }

  validate(info: BuildInfoArtifact): BuildInfoCompatibility {
    if (!isRecord(info) || typeof info.schemaVersion !== 'number') return { ok: false, reason: 'corrupt' }
    if (info.schemaVersion !== this.schemaVersion) return { ok: false, reason: 'schemaVersion' }
    if (!hasBuildInfoShape(info)) return { ok: false, reason: 'corrupt' }
    return { ok: true }
  }

  modulesFor(info: BuildInfoArtifact, imports: DesignSystemImportInput[]): string[] {
    const resolve = moduleResolver(info)
    const modules = new Set<string>()

    for (const input of imports) {
      for (const module of resolve(toImport(input))) modules.add(module)
    }

    for (const module of modules) {
      for (const imported of info.modules[module]?.imports ?? []) modules.add(imported)
    }

    return [...modules]
  }

  /** Names that resolve to no module here and may come from a star re-export. */
  unresolvedExports(info: BuildInfoArtifact, imports: DesignSystemImportInput[]): string[] {
    const resolve = moduleResolver(info)
    const names = imports.map(toImport).filter((input) => resolve(input).length === 0)
    return [...new Set(names.map((input) => input.name))]
  }

  /** Modules that publish token refs — keep them under treeshake. */
  tokenRefModules(info: BuildInfoArtifact): string[] {
    const out: string[] = []
    for (const key in info.modules) {
      if (info.modules[key]?.tokenRefs?.length) out.push(key)
    }
    return out
  }

  /** Export names `modules` import from `packageName`; `undefined` = all of it. */
  importsFromDependency(
    info: BuildInfoArtifact,
    modules: string[] | undefined,
    packageName: string,
  ): string[] | undefined {
    if (!info.designSystemDependencies?.includes(packageName)) return undefined
    const names = new Set<string>()
    for (const key of modules ?? Object.keys(info.modules)) {
      const imported = info.modules[key]?.dependencyImports?.[packageName]
      if (!imported) continue
      if (imported.includes('*')) return undefined
      for (const name of imported) names.add(name)
    }
    return [...names]
  }

  normalize(info: BuildInfoArtifact, options: BuildInfoNormalizeOptions): BuildInfoArtifact {
    const modules: BuildInfoArtifact['modules'] = {}

    for (const [key, entry] of Object.entries(info.modules)) {
      modules[options.mapModuleKey(key)] = entry.imports
        ? { ...entry, imports: entry.imports.map((imported) => options.mapModuleKey(imported)) }
        : entry
    }

    const normalized: BuildInfoArtifact = { ...info, modules }

    if (info.exports) {
      normalized.exports = {}
      for (const [name, key] of Object.entries(info.exports)) {
        normalized.exports[name] = options.mapModuleKey(key)
      }
    }

    if (info.sharedExports) {
      normalized.sharedExports = {}
      for (const [name, byModule] of Object.entries(info.sharedExports)) {
        const mapped: Record<string, string> = {}
        for (const [exposing, declaring] of Object.entries(byModule)) {
          mapped[options.mapModuleKey(exposing)] = options.mapModuleKey(declaring)
        }
        normalized.sharedExports[name] = mapped
      }
    }

    return normalized
  }

  hydrate(info: BuildInfoArtifact, options: BuildInfoHydrateOptions): BuildInfoHydrateResult {
    const compat = this.validate(info)
    if (!compat.ok) return { ok: false, reason: compat.reason, modules: [] }

    // The engine returns false when the artifact is structurally corrupt (a
    // dropped atom/recipe from an out-of-range intern index). Treat it like an
    // incompatibility so the caller re-extracts instead of hydrating partial CSS.
    let applied: boolean
    try {
      applied = this.#native.applyBuildInfo(options.name, info, options.only)
    } catch {
      return { ok: false, reason: 'corrupt', modules: [] }
    }
    if (!applied) return { ok: false, reason: 'corrupt', modules: [] }

    // The engine hydrates only modules that exist; report that exact set so the
    // result never claims to have hydrated an unknown `only` key.
    const modules = options.only ? options.only.filter((key) => key in info.modules) : Object.keys(info.modules)

    return { ok: true, modules }
  }
}

function hasBuildInfoShape(info: Record<string, unknown>): boolean {
  return (
    typeof info.panda === 'string' &&
    typeof info.configFingerprint === 'string' &&
    Array.isArray(info.strings) &&
    Array.isArray(info.atoms) &&
    (info.tokenRefs === undefined || Array.isArray(info.tokenRefs)) &&
    (info.viewTransitions === undefined || Array.isArray(info.viewTransitions)) &&
    isRecord(info.modules) &&
    (info.exports === undefined || isRecord(info.exports)) &&
    (info.sharedExports === undefined ||
      (isRecord(info.sharedExports) && Object.values(info.sharedExports).every(isRecord))) &&
    (info.recipes === undefined || isRecord(info.recipes)) &&
    (info.designSystemDependencies === undefined || isStringArray(info.designSystemDependencies)) &&
    (info.starReexportDependencies === undefined || isStringArray(info.starReexportDependencies)) &&
    Object.values(info.modules).every(hasModuleEntryShape)
  )
}

function hasModuleEntryShape(entry: unknown): boolean {
  if (!isRecord(entry)) return true
  if (entry.imports !== undefined && !isStringArray(entry.imports)) return false
  if (entry.dependencyImports === undefined) return true
  return isRecord(entry.dependencyImports) && Object.values(entry.dependencyImports).every(isStringArray)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toImport(input: DesignSystemImportInput): DesignSystemImport {
  return typeof input === 'string' ? { name: input } : input
}

function moduleResolver(info: BuildInfoArtifact): (input: DesignSystemImport) => string[] {
  const exports = isRecord(info.exports) ? info.exports : {}
  const shared = isRecord(info.sharedExports) ? info.sharedExports : {}
  const moduleKeys = isRecord(info.modules) ? Object.keys(info.modules) : []

  return ({ name, from }) => {
    const byModule = shared[name]
    if (isRecord(byModule)) {
      const exposing = Object.keys(byModule)
      const matched = from === undefined ? [] : closestModules(exposing, from)
      const declaring = (matched.length > 0 ? matched : exposing).map((key) => byModule[key])
      return [...new Set(declaring.filter((key): key is string => typeof key === 'string'))]
    }
    const exported = exports[name]
    if (typeof exported === 'string') return [exported]
    return closestModules(moduleKeys, from ?? name)
  }
}

const MODULE_EXTENSION = /\.(?:d\.)?[cm]?[jt]sx?$/

/** Module keys whose path ends with the most segments of `path`, ignoring extensions and `index`. */
function closestModules(moduleKeys: string[], path: string): string[] {
  const target = pathSegments(path)
  let best = 0
  let matches: string[] = []

  for (const key of moduleKeys) {
    const segments = pathSegments(key)
    let shared = 0
    while (
      shared < target.length &&
      shared < segments.length &&
      target[target.length - 1 - shared] === segments[segments.length - 1 - shared]
    ) {
      shared++
    }
    if (shared === 0 || shared < best) continue
    if (shared > best) {
      best = shared
      matches = []
    }
    matches.push(key)
  }

  return matches
}

function pathSegments(path: string): string[] {
  const segments = path.replace(MODULE_EXTENSION, '').split('/').filter(Boolean)
  if (segments.length > 1 && segments.at(-1) === 'index') segments.pop()
  return segments
}
