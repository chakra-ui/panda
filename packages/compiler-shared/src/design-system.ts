import type { BuildInfo } from './build-info'
import type {
  DesignSystemLoadOptions,
  DesignSystemLoadResult,
  DesignSystemManifest,
  DesignSystemManifestCompatibility,
  DesignSystemManifestInput,
  DesignSystemValidateOptions,
} from './types'
import { satisfiesVersionRange } from './semver'

/**
 * Minimal primitives `DesignSystem` needs; native and wasm adapters can map
 * their flat binding names into this smaller shape.
 */
export interface DesignSystemBinding {
  createManifest(input: DesignSystemManifestInput): DesignSystemManifest
  manifestSchemaVersion(): number
}

export class DesignSystem {
  readonly #binding: DesignSystemBinding
  readonly #buildInfo: BuildInfo
  readonly schemaVersion: number

  constructor(binding: DesignSystemBinding, buildInfo: BuildInfo) {
    this.#binding = binding
    this.#buildInfo = buildInfo
    this.schemaVersion = binding.manifestSchemaVersion()
  }

  create(input: DesignSystemManifestInput): DesignSystemManifest {
    return this.#binding.createManifest(input)
  }

  validate(manifest: DesignSystemManifest, options?: DesignSystemValidateOptions): DesignSystemManifestCompatibility {
    if (manifest.schemaVersion !== this.schemaVersion) return { ok: false, reason: 'schemaVersion' }

    const running = options?.pandaVersion
    if (running !== undefined && !satisfiesVersionRange(running, manifest.panda)) {
      return { ok: false, reason: 'pandaRange' }
    }

    return { ok: true }
  }

  load(manifest: DesignSystemManifest, options: DesignSystemLoadOptions): DesignSystemLoadResult {
    const compat = this.validate(manifest, { pandaVersion: options.pandaVersion })
    if (!compat.ok) return { ok: false, reason: compat.reason, modules: [] }

    const buildInfoCompat = this.#buildInfo.validate(options.buildInfo)
    if (!buildInfoCompat.ok) return { ok: false, reason: buildInfoCompat.reason, modules: [] }

    // `imports` omitted -> hydrate every module (namespace import); otherwise
    // resolve the touched modules so only their CSS emits (tree-shaking).
    const only =
      options.imports !== undefined ? this.#buildInfo.modulesFor(options.buildInfo, options.imports) : undefined
    const result = this.#buildInfo.hydrate(options.buildInfo, { name: manifest.name, only })
    if (!result.ok) return { ok: false, reason: result.reason, modules: [] }

    return { ok: true, name: manifest.name, modules: result.modules }
  }
}
