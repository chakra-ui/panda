import type {
  BuildInfoApi,
  DesignSystemApi,
  DesignSystemChainPlan,
  DesignSystemChainResult,
  DesignSystemLoadOptions,
  DesignSystemLoadResult,
  DesignSystemManifest,
  DesignSystemManifestCompatibility,
  DesignSystemManifestInput,
  DesignSystemValidateOptions,
} from './types'

/** The flat manifest primitives every binding (native / wasm) exposes; the
 *  `compiler.designSystem` namespace is built over these. */
export interface DesignSystemNative {
  createDesignSystemManifest(input: DesignSystemManifestInput): DesignSystemManifest
  designSystemManifestSchemaVersion(): number
  resolveDesignSystemChain(manifests: DesignSystemManifest[]): DesignSystemChainPlan
}

export const DESIGN_SYSTEM_MANIFEST_SCHEMA_VERSION = 1

/** Major from a version or range (`^2.1.0` → `2`); `NaN` when no number is found
 *  so an unreadable value fails the major check rather than passing silently. */
const major = (value: string): number => {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : NaN
}

export function checkManifestCompatibility(
  manifest: DesignSystemManifest,
  options: { schemaVersion: number; pandaVersion?: string },
): DesignSystemManifestCompatibility {
  if (manifest.schemaVersion !== options.schemaVersion) return { ok: false, reason: 'schemaVersion' }
  const running = options.pandaVersion
  if (running !== undefined && major(running) !== major(manifest.panda)) {
    return { ok: false, reason: 'pandaRange' }
  }
  return { ok: true }
}

/** Build the `compiler.designSystem` namespace over a binding's primitives.
 *  `validate` checks the wire-format `schemaVersion` and — given the consumer's
 *  running `pandaVersion` — that its major matches the manifest's `panda` range.
 *  Panda releases in lockstep, so the major boundary is the whole peer contract;
 *  finer skew is already caught by `schemaVersion` + the build-info fingerprint.
 *  `load` reuses the `buildInfo` namespace to hydrate the library's styles. */
export function makeDesignSystemApi(native: DesignSystemNative, buildInfo: BuildInfoApi): DesignSystemApi {
  const schemaVersion = native.designSystemManifestSchemaVersion()

  const validate = (
    manifest: DesignSystemManifest,
    options?: DesignSystemValidateOptions,
  ): DesignSystemManifestCompatibility =>
    checkManifestCompatibility(manifest, { schemaVersion, pandaVersion: options?.pandaVersion })

  return {
    schemaVersion,

    create: (input: DesignSystemManifestInput) => native.createDesignSystemManifest(input),

    validate,

    load: (manifest: DesignSystemManifest, options: DesignSystemLoadOptions): DesignSystemLoadResult => {
      const compat = validate(manifest, { pandaVersion: options.pandaVersion })
      if (!compat.ok) return { ok: false, reason: compat.reason, modules: [] }

      // `imports` omitted → hydrate every module (namespace import); otherwise
      // resolve the touched modules so only their CSS emits (tree-shaking).
      const only = options.imports !== undefined ? buildInfo.modulesFor(options.buildInfo, options.imports) : undefined
      const result = buildInfo.hydrate(options.buildInfo, { name: manifest.name, only })
      if (!result.ok) return { ok: false, reason: result.reason, modules: [] }

      return { ok: true, name: manifest.name, modules: result.modules }
    },

    resolveChain: (manifests: DesignSystemManifest[]): DesignSystemChainResult => {
      const plan = native.resolveDesignSystemChain(manifests)
      return plan.status === 'ordered'
        ? { ok: true, order: plan.order }
        : { ok: false, reason: 'cycle', cycle: plan.cycle }
    },
  }
}
