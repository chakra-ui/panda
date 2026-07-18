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
    const only = resolveHydrateOnly(this.#buildInfo, options.buildInfo, options.imports)
    const result = this.#buildInfo.hydrate(options.buildInfo, { name: manifest.name, only })
    if (!result.ok) return { ok: false, reason: result.reason, modules: [] }

    return { ok: true, name: manifest.name, modules: result.modules }
  }
}

/**
 * Narrow hydrate selection:
 * - `undefined` imports → full hydrate
 * - `[]` → nothing (app does not touch the package)
 * - non-empty names that resolve → those modules (+ token-ref modules)
 * - non-empty names that resolve to nothing / missing exports map → fail open (full)
 */
function resolveHydrateOnly(
  buildInfo: BuildInfo,
  artifact: DesignSystemLoadOptions['buildInfo'],
  imports: string[] | undefined,
): string[] | undefined {
  if (imports === undefined) return undefined
  if (imports.length === 0) return []

  const modules = buildInfo.modulesFor(artifact, imports)
  if (modules.length === 0) return undefined

  const only = new Set(modules)
  for (const key of buildInfo.tokenRefModules(artifact)) {
    only.add(key)
  }
  return only.size === modules.length ? modules : [...only]
}
