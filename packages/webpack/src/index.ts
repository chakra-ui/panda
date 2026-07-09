import { createNodeDriver, type Driver } from '@pandacss/compiler'
import { pandaTransformer, type PandaTransformerOptions } from '@pandacss/transformer'
import type { Compiler } from 'webpack'

export interface PandaWebpackPluginOptions extends PandaTransformerOptions {
  /** Project root. Defaults to the webpack compiler `context`. */
  cwd?: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
}

const NAME = 'PandaWebpackPlugin'

/**
 * webpack plugin for Panda CSS. Runs codegen, rewrites source via the native
 * transform loader, resolves the `@pandacss-internal/css` runtime module (both
 * through the shared `@pandacss/transformer` unplugin), and writes the
 * stylesheet so a plain `import 'styled-system/styles.css'` picks it up.
 */
export class PandaWebpackPlugin {
  readonly #options: PandaWebpackPluginOptions
  #driver: Driver | undefined
  #ready: Promise<void> | undefined

  constructor(options: PandaWebpackPluginOptions = {}) {
    this.#options = options
  }

  #build(cwd: string) {
    if (!this.#ready) {
      this.#ready = (async () => {
        const driver = await createNodeDriver({ cwd, configPath: this.#options.configPath })
        driver.codegen({ cwd, outdir: this.#options.outdir })
        driver.parseFiles()
        driver.writeCss({ outfile: driver.paths(this.#options.outdir).styleFile })
        this.#driver = driver
      })()
    }
    return this.#ready
  }

  apply(compiler: Compiler) {
    const cwd = this.#options.cwd ?? compiler.context ?? process.cwd()
    const { cwd: _cwd, configPath: _configPath, outdir: _outdir, ...transformerOptions } = this.#options

    // Transform loader + `@pandacss-internal/css` virtual module (shared unplugin).
    // Skip node_modules by default — third-party code is never Panda source.
    pandaTransformer
      .webpack({
        exclude: [/node_modules/],
        ...transformerOptions,
        getCompiler: () => this.#driver?.compiler,
      })
      .apply(compiler)

    // Build the driver, codegen, and stylesheet before modules are built.
    compiler.hooks.beforeCompile.tapPromise(NAME, () => this.#build(cwd))

    // Rebuild the stylesheet and register config/source watch edges each pass.
    compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
      const driver = this.#driver
      if (!driver) return
      compilation.hooks.finishModules.tap(NAME, () => {
        driver.parseFiles()
        driver.writeCss({ outfile: driver.paths(this.#options.outdir).styleFile })
      })
      if (driver.configPath) compilation.fileDependencies.add(driver.configPath)
      for (const file of driver.scan()) compilation.fileDependencies.add(file)
    })
  }
}

export default PandaWebpackPlugin
