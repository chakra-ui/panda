import { createNodeDriver, type NodeDriver } from '@pandacss/compiler'
import { formatDiagnostic, type Diagnostic } from '@pandacss/compiler-shared'
import { pandaTransformer } from '@pandacss/transformer'
import { dirname } from 'node:path'
import type { Plugin, PluginContext } from 'rollup'

export interface PandaRollupOptions {
  /** Project root. Defaults to `process.cwd()`. */
  cwd?: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
  /** File name of the emitted stylesheet asset. Defaults to `panda.css`. */
  fileName?: string
  /**
   * Emit design-system lib artifacts under `panda/` (`lib.json`, `buildinfo.json`,
   * `preset.mjs`) next to the bundle and sync the package `exports`, like
   * `panda lib`. Defaults to `false`.
   */
  lib?: boolean
  /**
   * Opt-in source rewrite (`css()` → class strings, etc.). Default: `false`.
   * Codegen and stylesheet emit always run.
   */
  transform?: boolean
}

/**
 * Rollup plugin for Panda CSS. Returns one or two plugins:
 *
 * - a driver-orchestration plugin that runs codegen and emits the stylesheet as
 *   a Rollup asset, since Rollup has no built-in CSS handling, and
 * - when `transform: true`, the shared `@pandacss/transformer` unplugin — source
 *   rewrite plus the `@pandacss-internal/css` runtime module.
 */
export function pandacss(options: PandaRollupOptions = {}): Plugin[] {
  const {
    cwd: cwdOption,
    configPath,
    outdir,
    fileName = 'panda.css',
    lib = false,
    transform: transformEnabled = false,
  } = options
  const cwd = cwdOption ?? process.cwd()
  let driver: NodeDriver | undefined
  let ready: Promise<void> | undefined

  const build = () => {
    if (!ready) {
      ready = (async () => {
        driver = await createNodeDriver({ cwd, configPath })
        driver.codegen({ cwd, outdir })
        driver.parseFiles()
      })()
    }
    return ready
  }

  const orchestrator: Plugin = {
    name: 'pandacss',

    async buildStart() {
      await build()
      // Watch the config and every scanned source so a change rebuilds.
      if (driver!.configPath) this.addWatchFile(driver!.configPath)
      for (const file of driver!.scan()) this.addWatchFile(file)
    },

    async watchChange(id) {
      if (!driver) return
      if (driver.isConfigFile(id)) {
        const diff = await driver.reload()
        if (diff.hasChanged) {
          driver.codegen({ cwd, outdir })
          driver.parseFiles()
        }
      } else if (driver.isSourceFile(id)) {
        driver.applyChange({ path: id, kind: 'change' })
      }
    },

    async generateBundle(output) {
      if (!driver) return
      const { css, diagnostics } = driver.cssgen()
      reportDiagnostics(this, driver.designSystemDiagnostics ?? [])
      reportDiagnostics(this, diagnostics)
      this.emitFile({ type: 'asset', fileName, source: css })

      if (!lib) return
      // Empty `files`: when transform is on the bundle is rewritten, so a source
      // re-scan can't work — buildinfo is authoritative and stale means "rebuild".
      const libOutdir = output.dir ?? (output.file ? dirname(output.file) : undefined)
      const result = await driver.writeDesignSystemLib({ outdir: libOutdir, files: [] })
      reportDiagnostics(this, result.diagnostics)
    },
  }

  if (!transformEnabled) return [orchestrator]

  const transform = pandaTransformer.rollup({
    getCompiler: () => driver?.compiler,
  })

  return [orchestrator, ...(Array.isArray(transform) ? transform : [transform])]
}

function reportDiagnostics(context: PluginContext, diagnostics: readonly Diagnostic[]) {
  for (const diagnostic of diagnostics) {
    const message = formatDiagnostic(diagnostic)
    if (diagnostic.severity === 'error') context.error(message)
    if (diagnostic.severity === 'warning') context.warn(message)
    if (diagnostic.severity === 'info') {
      if (typeof context.info === 'function') context.info(message)
      else context.warn(message)
    }
  }
}

export default pandacss
