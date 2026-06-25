import type { BuildInfo } from './build-info'
import type {
  DesignSystemChainPlan,
  DesignSystemChainResult,
  DesignSystemLoadOptions,
  DesignSystemLoadResult,
  DesignSystemManifest,
  DesignSystemManifestCompatibility,
  DesignSystemManifestInput,
  DesignSystemValidateOptions,
} from './types'

/**
 * The flat manifest primitives every binding (native / wasm) exposes; the
 * `compiler.designSystem` namespace is built over these.
 */
export interface DesignSystemNative {
  createDesignSystemManifest(input: DesignSystemManifestInput): DesignSystemManifest
  designSystemManifestSchemaVersion(): number
  resolveDesignSystemChain(manifests: DesignSystemManifest[]): DesignSystemChainPlan
}

/**
 * Major from a version or range (`^2.1.0` -> `2`); `NaN` when no number is found
 * so an unreadable value fails the major check rather than passing silently.
 */
const major = (value: string): number => {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : NaN
}

export class DesignSystem {
  readonly #native: DesignSystemNative
  readonly #buildInfo: BuildInfo
  readonly schemaVersion: number

  constructor(native: DesignSystemNative, buildInfo: BuildInfo) {
    this.#native = native
    this.#buildInfo = buildInfo
    this.schemaVersion = native.designSystemManifestSchemaVersion()
  }

  create(input: DesignSystemManifestInput): DesignSystemManifest {
    return this.#native.createDesignSystemManifest(input)
  }

  validate(manifest: DesignSystemManifest, options?: DesignSystemValidateOptions): DesignSystemManifestCompatibility {
    if (manifest.schemaVersion !== this.schemaVersion) return { ok: false, reason: 'schemaVersion' }

    const running = options?.pandaVersion
    if (running !== undefined && major(running) !== major(manifest.panda)) {
      return { ok: false, reason: 'pandaRange' }
    }

    return { ok: true }
  }

  load(manifest: DesignSystemManifest, options: DesignSystemLoadOptions): DesignSystemLoadResult {
    const compat = this.validate(manifest, { pandaVersion: options.pandaVersion })
    if (!compat.ok) return { ok: false, reason: compat.reason, modules: [] }

    // `imports` omitted -> hydrate every module (namespace import); otherwise
    // resolve the touched modules so only their CSS emits (tree-shaking).
    const only =
      options.imports !== undefined ? this.#buildInfo.modulesFor(options.buildInfo, options.imports) : undefined
    const result = this.#buildInfo.hydrate(options.buildInfo, { name: manifest.name, only })
    if (!result.ok) return { ok: false, reason: result.reason, modules: [] }

    return { ok: true, name: manifest.name, modules: result.modules }
  }

  resolveChain(manifests: DesignSystemManifest[]): DesignSystemChainResult {
    const plan = this.#native.resolveDesignSystemChain(manifests)
    return plan.status === 'ordered'
      ? { ok: true, order: plan.order }
      : { ok: false, reason: 'cycle', cycle: plan.cycle }
  }
}
