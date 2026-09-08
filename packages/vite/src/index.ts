import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import { formatDiagnostic, withDiagnosticFile, type SourceChange } from '@pandacss/compiler-shared'
import {
  createPandaSourcePluginHooks,
  createSourceTransformer,
  runSourceTransform,
  type SourceTransformer,
} from '@pandacss/transformer'
import { extname } from 'node:path'
import type { DevEnvironment, EnvironmentModuleNode, HotUpdateOptions, Plugin, ResolvedConfig } from 'vite'

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
    const watchTargets = driver.watchTargets()
    for (const file of watchTargets.files ?? driver.scan()) {
      if (file !== inputFile) watch(file)
    }
    for (const dir of watchTargets.dirs) {
      watch(driver.resolvePath(dir))
    }
    for (const dep of watchTargets.config) {
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

  const invalidateRoots = (environment: DevEnvironment): EnvironmentModuleNode[] => {
    const mods: EnvironmentModuleNode[] = []
    for (const id of rootIds) {
      const mod = environment.moduleGraph.getModuleById(id)
      if (mod) {
        environment.moduleGraph.invalidateModule(mod)
        mods.push(mod)
      }
    }
    return mods
  }

  const withInvalidatedRoots = (environment: DevEnvironment, modules: EnvironmentModuleNode[]) => {
    return [...new Set([...invalidateRoots(environment), ...modules])]
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

    async hotUpdate(ctx: HotUpdateOptions) {
      if (!driver) return
      // Vite runs this hook per environment, client first. The driver is shared and updated in the
      // client pass; other environments (SSR) still need their own stylesheet roots invalidated.
      if (this.environment !== ctx.server.environments.client) {
        return isPandaFile(driver, ctx.file) ? withInvalidatedRoots(this.environment, ctx.modules) : ctx.modules
      }

      const designSystemFile = driver.isDesignSystemFile?.(ctx.file) ?? false
      if (designSystemFile) {
        const change = await sourceChangeFromHotUpdate(ctx, designSystemFile === 'source')
        const changed = await driver.syncDesignSystemFileChange(change)
        if (changed) {
          if (designSystemFile === 'artifact') watchedFiles.clear()
          warnDesignSystemDiagnostics((message) => ctx.server.config.logger.warn(message))
        }
        return withInvalidatedRoots(this.environment, ctx.modules)
      }

      if (driver.isConfigFile(ctx.file)) {
        const diff = await driver.reload()
        if (!diff.hasChanged) return

        watchedFiles.clear()
        codegen()
        driver.parseFiles()
        warnDesignSystemDiagnostics((message) => ctx.server.config.logger.warn(message))
        invalidateRoots(this.environment)
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }

      if (driver.isSourceFile(ctx.file)) {
        driver.applyChange(await sourceChangeFromHotUpdate(ctx, true))
        warnDiagnostics(
          (message) => ctx.server.config.logger.warn(message),
          driver.compiler.getFile(ctx.file)?.diagnostics,
          `while parsing ${ctx.file}`,
          ctx.file,
        )
        return withInvalidatedRoots(this.environment, ctx.modules)
      }

      return ctx.modules
    },
  }
}

function isPandaFile(driver: Driver, file: string): boolean {
  return Boolean(driver.isDesignSystemFile?.(file)) || driver.isConfigFile(file) || driver.isSourceFile(file)
}

async function sourceChangeFromHotUpdate(ctx: HotUpdateOptions, read: boolean): Promise<SourceChange> {
  const kind = ctx.type === 'create' ? 'add' : ctx.type === 'delete' ? 'unlink' : 'change'
  return {
    path: ctx.file,
    kind,
    ...(read && kind !== 'unlink' ? { content: await ctx.read() } : {}),
  }
}

export default pandacss
