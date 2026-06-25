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
  readonly #schemaVersion: number
  readonly configFingerprint: string

  constructor(native: BuildInfoNative) {
    this.#native = native
    this.#schemaVersion = native.buildInfoSchemaVersion()
    this.configFingerprint = native.configFingerprint()
  }

  create(options: BuildInfoCreateOptions): BuildInfoArtifact {
    return this.#native.serializeBuildInfo(options.panda)
  }

  validate(info: BuildInfoArtifact): BuildInfoCompatibility {
    return info.schemaVersion === this.#schemaVersion ? { ok: true } : { ok: false, reason: 'schemaVersion' }
  }

  modulesFor(info: BuildInfoArtifact, exportNames: string[]): string[] {
    const exports = info.exports ?? {}
    const modules = new Set<string>()

    for (const name of exportNames) {
      const module = exports[name]
      if (module !== undefined) modules.add(module)
    }

    return [...modules]
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

    this.#native.applyBuildInfo(options.name, info, options.only)

    // The engine hydrates only modules that exist; report that exact set so the
    // result never claims to have hydrated an unknown `only` key.
    const modules = options.only ? options.only.filter((key) => key in info.modules) : Object.keys(info.modules)

    return { ok: true, modules }
  }
}
