import {
  BaseDriver,
  type Compiler,
  type DiffConfigResult,
  type ConfigSnapshot,
  type Driver,
  type SerializedConfig,
  type SourceChange,
} from '@pandacss/compiler-shared'
import { type WasmModule, createCompilerFromSnapshot, createCompilerFromWasmModule } from './index'

export interface BrowserDriverOptions {
  /** Pre-built config snapshot (no in-browser bundling — Rolldown is Node-only). */
  snapshot: ConfigSnapshot
  /** Source files to stage into the in-memory fs before the first `scan`. */
  sources?: Record<string, string>
  /**
   * An initialized `pkg-web` wasm module — the browser path: the caller does
   * `import init, * as mod from '@pandacss/compiler-wasm/pkg-web/compiler_wasm.js'; await init()`
   * and passes `mod` here. Omit in Node/SSR/tests to load the bundled `pkg-node`
   * artifact via `loadWasm`.
   */
  module?: WasmModule
}

const NO_CHANGE: DiffConfigResult = { hasChanged: false, dependencies: [], recipes: [], patterns: [], changes: [] }

/**
 * Build a {@link Driver} backed by the wasm compiler (`MemoryFileSystem`). The
 * browser has no disk, so the host hands in a pre-built config snapshot and
 * stages source files into the in-memory fs; `scan` then runs over that tree in
 * Rust.
 *
 * Pass an initialized `pkg-web` `module` for the real browser path; omit it in
 * Node/SSR/tests to load the bundled `pkg-node` artifact.
 */
export async function createBrowserDriver(options: BrowserDriverOptions): Promise<Driver> {
  const compiler = options.module
    ? createCompilerFromWasmModule(options.module, options.snapshot.config, {
        callbacks: options.snapshot.callbacks,
      })
    : await createCompilerFromSnapshot(options.snapshot)

  if (options.sources) {
    for (const [path, content] of Object.entries(options.sources)) {
      compiler.fs.addFile?.(path, content)
    }
  }
  return new BrowserDriver(compiler, options.snapshot.config)
}

class BrowserDriver extends BaseDriver {
  #config: SerializedConfig

  constructor(compiler: Compiler, config: SerializedConfig) {
    super(compiler)
    this.#config = config
  }

  get config() {
    return this.#config
  }

  get configPath() {
    return undefined
  }

  get configDependencies() {
    return [] as string[]
  }

  // Browser drivers are snapshot-fed; reloading happens by constructing a fresh
  // driver with a new snapshot, so there's nothing to diff here.
  async reload(): Promise<DiffConfigResult> {
    return NO_CHANGE
  }

  applyChange(change: SourceChange): boolean {
    if (change.kind === 'unlink') {
      this.compiler.fs.removeFile?.(change.path)
      return this.compiler.removeFile(change.path)
    }
    if (change.content == null) return false
    this.compiler.fs.addFile?.(change.path, change.content)
    this.compiler.parseFileSource(change.path, change.content)
    return true
  }

  getOutdir(outdir?: string): string {
    return this.compiler.path.resolve(this.getConfiguredOutdir(outdir))
  }
}
