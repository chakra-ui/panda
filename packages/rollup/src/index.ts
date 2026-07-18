import { createNodeDriver, type NodeDriver } from '@pandacss/compiler'
import { pandaTransformer, type PandaTransformerOptions } from '@pandacss/transformer'
import { dirname } from 'node:path'
import type { Plugin } from 'rollup'

export interface PandaRollupOptions extends PandaTransformerOptions {
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
}

/**
 * Rollup plugin for Panda CSS. Returns two plugins:
 *
 * - the shared `@pandacss/transformer` unplugin — source transform plus the
 *   `@pandacss-internal/css` runtime module (`resolveId` / `load` / `transform`,
 *   mirroring the Vite adapter), and
 * - a driver-orchestration plugin that runs codegen and emits the stylesheet as
 *   a Rollup asset, since Rollup has no built-in CSS handling.
 */
export function pandacss(options: PandaRollupOptions = {}): Plugin[] {
  const { cwd: cwdOption, configPath, outdir, fileName = 'panda.css', lib = false, ...transformerOptions } = options
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
      const { css } = driver.cssgen()
      this.emitFile({ type: 'asset', fileName, source: css })

      if (!lib) return
      // Empty `files`: the bundle is transformed, so a source re-scan can't work —
      // buildinfo is authoritative and stale means "rebuild".
      const libOutdir = output.dir ?? (output.file ? dirname(output.file) : undefined)
      const result = await driver.writeDesignSystemLib({ outdir: libOutdir, files: [] })
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.severity === 'error') this.warn(diagnostic.message)
      }
    },
  }

  const transform = pandaTransformer.rollup({
    ...transformerOptions,
    getCompiler: () => driver?.compiler,
  })

  return [orchestrator, ...(Array.isArray(transform) ? transform : [transform])]
}

export default pandacss
