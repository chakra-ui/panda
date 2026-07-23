import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import { formatDiagnostic, withDiagnosticFile } from '@pandacss/compiler-shared'
import {
  createPandaSourcePluginHooks,
  createSourceTransformer,
  runSourceTransform,
  type SourceTransformer,
} from '@pandacss/transformer'
import { extname } from 'node:path'
import type { HmrContext, ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite'

export interface PandaPluginOptions {
  /** Project root. Defaults to Vite's resolved `root`. */
  cwd?: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
  /**
   * Opt-in source rewrite (`css()` → class strings, etc.). Default: `false`.
   * CSS injection, codegen, and HMR always run.
   */
  transform?: boolean
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

/**
 * Vite plugin for Panda CSS.
 * The CSS file declaring Panda layers is treated as the generated CSS root.
 */
export function pandacss(options: PandaPluginOptions = {}): Plugin {
  const { cwd: cwdOption, configPath, outdir: outdirOption, transform: transformEnabled = false } = options
  let driver: Driver | undefined
  let cwd = ''
  let outdir: string | undefined
  let resolvedConfig: ResolvedConfig | undefined
  let designSystemDiagnosticsRef: readonly Diagnostic[] | undefined
  let sourceTransformer: SourceTransformer | undefined
  let sourceTransformerCompiler: Driver['compiler'] | undefined
  const watchedFiles = new Set<string>()
  const rootIds = new Set<string>()

  const resolveSourceTransformer = () => {
    const compiler = driver?.compiler
    if (!compiler) return undefined
    if (sourceTransformerCompiler !== compiler) {
      sourceTransformer = createSourceTransformer(compiler)
      sourceTransformerCompiler = compiler
    }
    return sourceTransformer
  }
  const sourceHooks = transformEnabled
    ? createPandaSourcePluginHooks(() => ({
        getCompiler: () => driver?.compiler,
        getTransformer: () => resolveSourceTransformer(),
      }))
    : undefined

  const codegen = () => {
    driver?.codegen({ cwd, outdir })
  }

  const addPandaWatchFiles = (addWatchFile: (file: string) => void, inputId: string) => {
    if (!driver) return

    const watch = (file: string) => {
      if (watchedFiles.has(file)) return
      watchedFiles.add(file)
      addWatchFile(file)
    }
    const inputFile = inputId.split('?')[0] ?? inputId
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
    if (diagnostics === designSystemDiagnosticsRef) return

    designSystemDiagnosticsRef = diagnostics
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
      cwd = cwdOption ?? config.root
      driver = await createNodeDriver({ cwd, configPath })
      if (transformEnabled) {
        resolveSourceTransformer()
      }
      outdir = outdirOption
      codegen()
      driver.parseFiles()
    },

    resolveId(id) {
      return sourceHooks?.resolveId(id) ?? null
    },

    load(id) {
      return sourceHooks?.load(id) ?? null
    },

    transform(code, id) {
      const transformer = transformEnabled ? resolveSourceTransformer() : undefined
      if (transformer) {
        const sourceResult = runSourceTransform(
          this,
          {
            getCompiler: () => driver?.compiler,
            getTransformer: () => transformer,
          },
          code,
          id,
        )
        if (sourceResult) {
          warnDiagnostics((message) => this.warn(message), sourceResult.diagnostics, 'while transforming source', id)
          return { code: sourceResult.code, map: sourceResult.map }
        }
      }

      if (!driver || extname(id.split('?')[0] ?? id) !== '.css') return null
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

      const polyfill = driver.config.polyfill === true
      const output = driver.cssgen({ emitLayerDeclaration: false, polyfill })
      warnDiagnostics((message) => this.warn(message), output.diagnostics, 'while compiling the stylesheet')

      const entry = polyfill ? driver.compiler.stripLayerOrderStatements(code) : code
      return { code: `${entry}\n${output.css}`, map: null }
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
        if (changed) {
          if (designSystemFile === 'artifact') watchedFiles.clear()
          warnDesignSystemDiagnostics((message) => ctx.server.config.logger.warn(message))
        }
        return withInvalidatedRoots(ctx.server, ctx.modules)
      }

      if (driver.isConfigFile(ctx.file)) {
        const diff = await driver.reload()
        if (!diff.hasChanged) return

        watchedFiles.clear()
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
