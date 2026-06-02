import { createNodeDriver, type Driver } from '@pandacss/compiler'
import { extname } from 'node:path'
import type { HmrContext, ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite'

export interface PandaPluginOptions {
  /** Project root. Defaults to Vite's resolved `root`. */
  cwd?: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
}

/**
 * Vite plugin for the Panda CSS v2 engine. Holds one long-lived {@link Driver}:
 * writes codegen artifacts to disk, and injects the compiled stylesheet into the
 * CSS file that declares Panda's layers (`@layer reset, base, …;`). Source edits
 * re-emit the root CSS module in the same HMR transaction as the JS update.
 */
export function pandacss(options: PandaPluginOptions = {}): Plugin {
  let driver: Driver | undefined
  let cwd = ''
  let outdir: string | undefined
  const rootIds = new Set<string>()

  const codegen = () => {
    driver?.codegen({ cwd, outdir })
  }

  const invalidateRoots = (server: ViteDevServer): ModuleNode[] => {
    const mods: ModuleNode[] = []
    for (const id of rootIds) {
      const mod = server.moduleGraph.getModuleById(id)
      if (mod) {
        server.moduleGraph.invalidateModule(mod)
        mods.push(mod)
      }
    }
    return mods
  }

  return {
    name: 'pandacss',
    enforce: 'pre',

    // configResolved (not buildStart): runs before Vite's dep scan/warmup, so
    // the `styled-system/*` runtime exists on disk before anything resolves it.
    async configResolved(config: ResolvedConfig) {
      cwd = options.cwd ?? config.root
      driver = await createNodeDriver({ cwd, configPath: options.configPath })
      outdir = options.outdir
      codegen()
      driver.parseFiles()
    },

    transform(code, id) {
      if (!driver || extname(id.split('?')[0]) !== '.css') return null
      if (!driver.compiler.hasLayerDeclaration(code)) return null

      rootIds.add(id)
      const output = driver.cssgen({ emitLayerDeclaration: false })
      if (output.diagnostics.length > 0) {
        this.warn(`panda: ${output.diagnostics.length} diagnostic(s) while compiling the stylesheet`)
      }
      // Keep the user's declaration (it fixes layer order, incl. any custom
      // layers) and append Panda's layer bodies after their CSS.
      return { code: `${code}\n${output.css}`, map: null }
    },

    async handleHotUpdate(ctx: HmrContext) {
      if (!driver) return

      if (driver.isConfigFile(ctx.file)) {
        const diff = await driver.reload()
        if (!diff.hasChanged) return
        // Runtime/types artifacts may have changed shape → rewrite + full reload.
        codegen()
        driver.parseFiles()
        invalidateRoots(ctx.server)
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }

      if (driver.isSourceFile(ctx.file)) {
        driver.applyChange({ path: ctx.file, kind: 'change', content: await ctx.read() })
        // Re-emit the root stylesheet alongside the JS update in one HMR payload.
        return [...ctx.modules, ...invalidateRoots(ctx.server)]
      }

      return ctx.modules
    },
  }
}

export default pandacss
