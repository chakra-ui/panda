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
 * Vite plugin for the Panda CSS v2 engine.
 * The CSS file declaring Panda layers is treated as the generated CSS root.
 */
export function pandacss(options: PandaPluginOptions = {}): Plugin {
  let driver: Driver | undefined
  let cwd = ''
  let outdir: string | undefined
  const rootIds = new Set<string>()

  const codegen = () => {
    driver?.codegen({ cwd, outdir })
  }

  const addPandaWatchFiles = (addWatchFile: (file: string) => void, inputId: string) => {
    if (!driver) return

    const inputFile = inputId.split('?')[0]
    for (const file of driver.scan()) {
      if (file !== inputFile) addWatchFile(file)
    }
    for (const dep of driver.watchTargets().config) {
      addWatchFile(driver.resolvePath(dep))
    }
    if (driver.configPath) {
      addWatchFile(driver.configPath)
    }
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
      addPandaWatchFiles((file) => this.addWatchFile(file), id)

      const output = driver.cssgen({ emitLayerDeclaration: false })
      if (output.diagnostics.length > 0) {
        this.warn(`panda: ${output.diagnostics.length} diagnostic(s) while compiling the stylesheet`)
      }

      return { code: `${code}\n${output.css}`, map: null }
    },

    async handleHotUpdate(ctx: HmrContext) {
      if (!driver) return

      if (driver.isConfigFile(ctx.file)) {
        const diff = await driver.reload()
        if (!diff.hasChanged) return

        codegen()
        driver.parseFiles()
        invalidateRoots(ctx.server)
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }

      if (driver.isSourceFile(ctx.file)) {
        driver.applyChange({ path: ctx.file, kind: 'change', content: await ctx.read() })
        return [...ctx.modules, ...invalidateRoots(ctx.server)]
      }

      return ctx.modules
    },
  }
}

export default pandacss
