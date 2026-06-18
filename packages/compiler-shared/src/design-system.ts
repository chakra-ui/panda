import type {
  DesignSystemApi,
  DesignSystemManifest,
  DesignSystemManifestCompatibility,
  DesignSystemManifestInput,
} from './types'

/** The flat manifest primitives every binding (native / wasm) exposes; the
 *  `compiler.designSystem` namespace is built over these. */
export interface DesignSystemNative {
  createDesignSystemManifest(input: DesignSystemManifestInput): DesignSystemManifest
  designSystemManifestSchemaVersion(): number
}

/** Build the `compiler.designSystem` namespace over a binding's primitives.
 *  `validate` checks `schemaVersion`; the peer-range check is host-layered. */
export function makeDesignSystemApi(native: DesignSystemNative): DesignSystemApi {
  const schemaVersion = native.designSystemManifestSchemaVersion()

  return {
    schemaVersion,

    create: (input: DesignSystemManifestInput) => native.createDesignSystemManifest(input),

    validate: (manifest: DesignSystemManifest): DesignSystemManifestCompatibility =>
      manifest.schemaVersion === schemaVersion ? { ok: true } : { ok: false, reason: 'schemaVersion' },
  }
}
