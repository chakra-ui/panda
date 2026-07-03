import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import { formatDiagnostic } from '@pandacss/compiler-shared'
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

function warnDiagnostics(
  warn: (message: string) => void,
  diagnostics: readonly Diagnostic[] | undefined,
  context: string,
  file?: string,
) {
  if (!diagnostics?.length) return
  const shown = diagnostics
    .slice(0, 3)
    .map((diagnostic) => formatDiagnostic(withDiagnosticFile(diagnostic, file)))
    .join('\n')
  const hidden = diagnostics.length > 3 ? `\n...and ${diagnostics.length - 3} more` : ''
  warn(`panda: ${diagnostics.length} diagnostic(s) ${context}\n${shown}${hidden}`)
}

function withDiagnosticFile(diagnostic: Diagnostic, file: string | undefined): Diagnostic {
  if (!file || diagnostic.file) return diagnostic
  return { ...diagnostic, file }
}

/**
 * Vite plugin for Panda CSS.
 * The CSS file declaring Panda layers is treated as the generated CSS root.
 */
export function pandacss(options: PandaPluginOptions = {}): Plugin {
  let driver: Driver | undefined
  let cwd = ''
  let outdir: string | undefined
  let resolvedConfig: ResolvedConfig | undefined
  let designSystemDiagnosticsKey = ''
  const rootIds = new Set<string>()

  const codegen = () => {
    driver?.codegen({ cwd, outdir })
  }

  const addPandaWatchFiles = (addWatchFile: (file: string) => void, inputId: string) => {
    if (!driver) return

    const seen = new Set<string>()
    const watch = (file: string) => {
      if (seen.has(file)) return
      seen.add(file)
      addWatchFile(file)
    }
    const inputFile = inputId.split('?')[0]
    for (const file of driver.scan()) {
      if (file !== inputFile) watch(file)
    }
    for (const dep of driver.watchTargets().config) {
      watch(driver.resolvePath(dep))
    }
    if (driver.configPath) {
      watch(driver.configPath)
    }
    for (const target of driver.designSystemWatchTargets?.() ?? []) {
      watch(target.manifestPath)
      watch(target.buildInfoPath)
      watch(target.presetPath)
      for (const file of target.sourceFiles) {
        watch(file)
      }
    }
  }

  const warnDesignSystemDiagnostics = (warn: (message: string) => void) => {
    const diagnostics = driver?.designSystemDiagnostics ?? []
    const key = JSON.stringify(diagnostics)
    if (key === designSystemDiagnosticsKey) return

    designSystemDiagnosticsKey = key
    warnDiagnostics(warn, diagnostics, 'while loading the design system')
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

  const withInvalidatedRoots = (server: ViteDevServer, modules: ModuleNode[]) => {
    return [...new Set([...invalidateRoots(server), ...modules])]
  }

  return {
    name: 'pandacss',
    enforce: 'pre',

    async configResolved(config: ResolvedConfig) {
      resolvedConfig = config
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
      warnDesignSystemDiagnostics((message) => {
        if (resolvedConfig) {
          resolvedConfig.logger.warn(message)
        } else {
          this.warn(message)
        }
      })

      const output = driver.cssgen({ emitLayerDeclaration: false })
      warnDiagnostics((message) => this.warn(message), output.diagnostics, 'while compiling the stylesheet')

      return { code: `${code}\n${output.css}`, map: null }
    },

    async handleHotUpdate(ctx: HmrContext) {
      if (!driver) return

      const designSystemFile = driver.isDesignSystemFile?.(ctx.file) ?? false
      if (designSystemFile) {
        const changed = await driver.syncDesignSystemFileChange({
          path: ctx.file,
          kind: 'change',
          ...(designSystemFile === 'source' ? { content: await ctx.read() } : {}),
        })
        if (changed) warnDesignSystemDiagnostics((message) => ctx.server.config.logger.warn(message))
        return withInvalidatedRoots(ctx.server, ctx.modules)
      }

      if (driver.isConfigFile(ctx.file)) {
        const diff = await driver.reload()
        if (!diff.hasChanged) return

        codegen()
        driver.parseFiles()
        warnDesignSystemDiagnostics((message) => ctx.server.config.logger.warn(message))
        invalidateRoots(ctx.server)
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }

      if (driver.isSourceFile(ctx.file)) {
        driver.applyChange({ path: ctx.file, kind: 'change', content: await ctx.read() })
        warnDiagnostics(
          (message) => ctx.server.config.logger.warn(message),
          driver.compiler.getFile(ctx.file)?.diagnostics,
          `while parsing ${ctx.file}`,
          ctx.file,
        )
        return withInvalidatedRoots(ctx.server, ctx.modules)
      }

      return ctx.modules
    },
  }
}

export default pandacss
