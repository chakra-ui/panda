import type {
  BuildInfo,
  BuildInfoApi,
  BuildInfoCompatibility,
  BuildInfoCreateOptions,
  BuildInfoHydrateOptions,
  BuildInfoHydrateResult,
} from './types'

/** The flat build-info primitives every binding (native / wasm) exposes. The
 *  ergonomic `compiler.buildInfo` namespace is built over these. The engine owns
 *  the config fingerprint (stamped as `configFingerprint`), so the producer only
 *  supplies the published `panda` range. */
export interface BuildInfoNative {
  serializeBuildInfo(panda: string): BuildInfo
  applyBuildInfo(name: string, buildInfo: BuildInfo, only?: string[]): boolean
  buildInfoSchemaVersion?(): number
  configFingerprint(): string
}

/** Build the `compiler.buildInfo` namespace over a binding's primitives.
 *
 *  `validate` authoritatively checks the wire-format `schemaVersion` against
 *  what this binding reads; the Panda peer-range / config-hash checks are
 *  layered on by the host (it knows the running version) and surface through the
 *  same `reason` union. */
export function makeBuildInfoApi(native: BuildInfoNative): BuildInfoApi {
  const schemaVersion = resolveSchemaVersion(native)

  const validate = (info: BuildInfo): BuildInfoCompatibility =>
    info.schemaVersion === schemaVersion ? { ok: true } : { ok: false, reason: 'schemaVersion' }

  return {
    configFingerprint: native.configFingerprint(),

    create: (options: BuildInfoCreateOptions) => native.serializeBuildInfo(options.panda),

    validate,

    modulesFor: (info: BuildInfo, exportNames: string[]): string[] => {
      const exports = info.exports ?? {}
      const modules = new Set<string>()

      for (const name of exportNames) {
        const module = exports[name]
        if (module !== undefined) modules.add(module)
      }

      return [...modules]
    },

    hydrate: (info: BuildInfo, options: BuildInfoHydrateOptions): BuildInfoHydrateResult => {
      const compat = validate(info)
      if (!compat.ok) return { ok: false, reason: compat.reason, modules: [] }

      native.applyBuildInfo(options.name, info, options.only)

      // The engine hydrates only modules that exist; report that exact set so the
      // result never claims to have hydrated an unknown `only` key.
      const modules = options.only ? options.only.filter((key) => key in info.modules) : Object.keys(info.modules)

      return { ok: true, modules }
    },
  }
}

function resolveSchemaVersion(native: BuildInfoNative): number {
  const schemaVersion = native.buildInfoSchemaVersion?.()
  if (typeof schemaVersion === 'number') return schemaVersion

  // Some native bindings expose the serialized build-info shape but omit the
  // direct schema-version accessor. The serializer still stamps the version, so
  // derive it once and keep the public JS contract stable.
  return native.serializeBuildInfo('0.0.0').schemaVersion
}
