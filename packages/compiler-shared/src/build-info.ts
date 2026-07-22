import type {
  BuildInfoCompatibility,
  BuildInfoCreateOptions,
  BuildInfoArtifact,
  BuildInfoHydrateOptions,
  BuildInfoHydrateResult,
  BuildInfoNormalizeOptions,
} from './types'

/**
 * The flat build-info primitives every binding (native / wasm) exposes. The
 * ergonomic `compiler.buildInfo` namespace is built over these. The engine owns
 * the config fingerprint (stamped as `configFingerprint`), so the producer only
 * supplies the published `panda` range.
 */
export interface BuildInfoNative {
  serializeBuildInfo(panda: string): BuildInfoArtifact
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
    return this.#native.serializeBuildInfo(options.panda)
  }

  validate(info: BuildInfoArtifact): BuildInfoCompatibility {
    if (!isRecord(info) || typeof info.schemaVersion !== 'number') return { ok: false, reason: 'corrupt' }
    if (info.schemaVersion !== this.schemaVersion) return { ok: false, reason: 'schemaVersion' }
    if (!hasBuildInfoShape(info)) return { ok: false, reason: 'corrupt' }
    return { ok: true }
  }

  modulesFor(info: BuildInfoArtifact, exportNames: string[]): string[] {
    const exports = isRecord(info.exports) ? info.exports : {}
    const moduleKeys = isRecord(info.modules) ? new Set(Object.keys(info.modules)) : new Set<string>()
    const modules = new Set<string>()

    for (const name of exportNames) {
      const fromExport = exports[name]
      if (typeof fromExport === 'string') {
        modules.add(fromExport)
        continue
      }
      const fromKey = resolveModuleKey(name, moduleKeys)
      if (fromKey) modules.add(fromKey)
    }

    return [...modules]
  }

  /** Modules that publish token refs — keep them under treeshake. */
  tokenRefModules(info: BuildInfoArtifact): string[] {
    const out: string[] = []
    for (const key in info.modules) {
      if (info.modules[key]?.tokenRefs?.length) out.push(key)
    }
    return out
  }

  normalize(info: BuildInfoArtifact, options: BuildInfoNormalizeOptions): BuildInfoArtifact {
    const modules: BuildInfoArtifact['modules'] = {}

    for (const [key, entry] of Object.entries(info.modules)) {
      modules[options.mapModuleKey(key)] = entry
    }

    if (!info.exports) return { ...info, modules }

    const exports: Record<string, string> = {}

    for (const [name, key] of Object.entries(info.exports)) {
      exports[name] = options.mapModuleKey(key)
    }

    return { ...info, modules, exports }
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
    (info.recipes === undefined || isRecord(info.recipes))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const MODULE_KEY_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'] as const

/** Resolve a subpath stem (`badge`) or key (`badge.tsx`) against `modules` keys. */
function resolveModuleKey(name: string, moduleKeys: Set<string>): string | undefined {
  if (moduleKeys.has(name)) return name
  for (const ext of MODULE_KEY_EXTENSIONS) {
    const key = name.endsWith(ext) ? name : `${name}${ext}`
    if (moduleKeys.has(key)) return key
  }
  return undefined
}
