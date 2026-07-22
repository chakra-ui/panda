import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import { formatDiagnostic, withDiagnosticFile } from '@pandacss/compiler-shared'
import { pandaTransformer } from '@pandacss/transformer'
import type { Compiler } from 'webpack'
import type { PandaCssLoaderOptions } from './css-loader'

export interface PandaWebpackPluginOptions {
  /** Project root. Defaults to the webpack compiler `context`. */
  cwd?: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
  /**
   * Opt-in source rewrite (`css()` → class strings, etc.). Default: `false`.
   * CSS injection, codegen, and watch sync always run.
   */
  transform?: boolean
}

const NAME = 'PandaWebpackPlugin'

/**
 * webpack plugin for Panda CSS. Runs codegen and injects generated CSS
 * in-memory into any stylesheet that declares Panda layers — no file is
 * written. Pass `transform: true` to also rewrite source via the shared
 * `@pandacss/transformer` unplugin (and resolve `@pandacss-internal/css`).
 */
export class PandaWebpackPlugin {
  readonly #options: PandaWebpackPluginOptions
  #driver: Driver | undefined
  #ready: Promise<void> | undefined
  #designSystemDiagnosticsRef: readonly Diagnostic[] | undefined

  constructor(options: PandaWebpackPluginOptions = {}) {
    this.#options = options
  }

  #build(cwd: string) {
    if (!this.#ready) {
      this.#ready = (async () => {
        const driver = await createNodeDriver({ cwd, configPath: this.#options.configPath })
        driver.codegen({ cwd, outdir: this.#options.outdir })
        driver.parseFiles()
        this.#driver = driver
      })()
    }
    return this.#ready
  }

  /** Watch-mode incremental sync: fold changed files into the driver before this
   *  rebuild's modules (including the layer-declaring CSS) are read. The driver
   *  re-reads changed files through its own fs. */
  async #sync(cwd: string, changed: Iterable<string>, warn?: (message: string) => void) {
    await this.#build(cwd)
    const driver = this.#driver!
    let configChanged = false
    let designSystemChanged = false

    for (const file of changed) {
      const designSystemFile = driver.isDesignSystemFile?.(file) ?? false
      if (designSystemFile) {
        const synced = await driver.syncDesignSystemFileChange({ path: file, kind: 'change' })
        if (synced) designSystemChanged = true
        continue
      }

      if (driver.isConfigFile(file)) {
        configChanged = true
      } else if (driver.isSourceFile(file)) {
        driver.applyChange({ path: file, kind: 'change' })
      }
    }

    if (configChanged) {
      const diff = await driver.reload()
      if (diff.hasChanged) {
        driver.codegen({ cwd, outdir: this.#options.outdir })
        driver.parseFiles()
        designSystemChanged = true
      }
    }

    if (designSystemChanged) {
      this.#warnDesignSystemDiagnostics(warn)
    }
  }

  #warnDesignSystemDiagnostics(warn?: (message: string) => void) {
    if (!warn) return
    const diagnostics = this.#driver?.designSystemDiagnostics ?? []
    if (diagnostics === this.#designSystemDiagnosticsRef) return

    this.#designSystemDiagnosticsRef = diagnostics
    if (!diagnostics.length) return

    const shown = diagnostics
      .slice(0, 3)
      .map((diagnostic) => formatDiagnostic(withDiagnosticFile(diagnostic)))
      .join('\n')
    const hidden = diagnostics.length > 3 ? `\n...and ${diagnostics.length - 3} more` : ''
    warn(`panda: ${diagnostics.length} diagnostic(s) while loading the design system\n${shown}${hidden}`)
  }

  apply(compiler: Compiler) {
    const cwd = this.#options.cwd ?? compiler.context ?? process.cwd()
    const logger = compiler.getInfrastructureLogger?.(NAME)

    if (this.#options.transform) {
      // Source transform loader + `@pandacss-internal/css` virtual module (shared
      // unplugin). Skip node_modules — third-party code is never Panda source.
      pandaTransformer
        .webpack({
          exclude: [/node_modules/],
          getCompiler: () => this.#driver?.compiler,
        })
        .apply(compiler)
    }

    // Inject generated CSS in-memory: a `pre` loader on layer-declaring `.css`,
    // handed a live getter for the driver.
    const options: PandaCssLoaderOptions = { getDriver: () => this.#driver }
    compiler.options.module.rules.push({
      test: /\.css$/,
      exclude: /node_modules/,
      enforce: 'pre',
      use: [{ loader: '@pandacss/webpack/css-loader', options }],
    })

    // First compile: build the driver, codegen, and parse.
    compiler.hooks.beforeCompile.tapPromise(NAME, () => this.#build(cwd))

    // Watch rebuild: sync changed files into the driver before modules are read.
    compiler.hooks.watchRun.tapPromise(NAME, (c) =>
      this.#sync(cwd, c.modifiedFiles ?? [], (message) => logger?.warn(message)),
    )
  }
}

export default PandaWebpackPlugin
