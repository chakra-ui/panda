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
} from './types'

/** The flat manifest primitives every binding (native / wasm) exposes; the
 *  `compiler.designSystem` namespace is built over these. */
export interface DesignSystemNative {
  createDesignSystemManifest(input: DesignSystemManifestInput): DesignSystemManifest
  designSystemManifestSchemaVersion(): number
  resolveDesignSystemChain(manifests: DesignSystemManifest[]): DesignSystemChainPlan
}

/** Build the `compiler.designSystem` namespace over a binding's primitives.
 *  `validate` checks `schemaVersion`; the peer-range check is host-layered.
 *  `load` reuses the `buildInfo` namespace to resolve + hydrate the library's
 *  pre-extracted styles, keeping that logic in one place. */
export function makeDesignSystemApi(native: DesignSystemNative, buildInfo: BuildInfoApi): DesignSystemApi {
  const schemaVersion = native.designSystemManifestSchemaVersion()

  const validate = (manifest: DesignSystemManifest): DesignSystemManifestCompatibility =>
    manifest.schemaVersion === schemaVersion ? { ok: true } : { ok: false, reason: 'schemaVersion' }

  return {
    schemaVersion,

    create: (input: DesignSystemManifestInput) => native.createDesignSystemManifest(input),

    validate,

    load: (manifest: DesignSystemManifest, options: DesignSystemLoadOptions): DesignSystemLoadResult => {
      const compat = validate(manifest)
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
