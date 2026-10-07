import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import {
  appendPandaStylesheet,
  createDiagnosticLog,
  findImportedLayerDeclaration,
  type SourceChange,
} from '@pandacss/compiler-shared'
import {
  createPandaSourcePluginHooks,
  createSourceTransformer,
  runSourceTransform,
  type SourceTransformer,
} from '@pandacss/transformer'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute } from 'node:path'
import type { DevEnvironment, EnvironmentModuleNode, HotUpdateOptions, Plugin, ResolvedConfig, Rollup } from 'vite'

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

/**
 * Vite plugin for Panda CSS.
 * The CSS file declaring Panda layers is treated as the generated CSS root.
 */
export function pandacss(options: PandaPluginOptions = {}): Plugin[] {
  const { cwd: cwdOption, configPath, outdir: outdirOption, transform: transformEnabled = false } = options
  let driver: Driver | undefined
  let cwd = ''
  let outdir: string | undefined
  let resolvedConfig: ResolvedConfig | undefined
  let designSystemDiagnosticsRef: readonly Diagnostic[] | undefined
  let sourceTransformer: SourceTransformer | undefined
  let sourceTransformerCompiler: Driver['compiler'] | undefined
  const warnDiagnostics = createDiagnosticLog()
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

  const injectStylesheet = (ctx: Rollup.TransformPluginContext, code: string, id: string): Rollup.TransformResult => {
    rootIds.add(id)
    addPandaWatchFiles((file) => ctx.addWatchFile(file), id)
    warnDesignSystemDiagnostics((message) => {
      if (resolvedConfig) {
        resolvedConfig.logger.warn(message)
      } else {
        ctx.warn(message)
      }
    })

    const stylesheet = appendPandaStylesheet(driver!, code)
    warnDiagnostics((message) => ctx.warn(message), stylesheet.diagnostics, 'while compiling the stylesheet', {
      onlyNew: true,
    })
    return { code: stylesheet.code, map: null }
  }

  const importsLayerDeclaration = async (ctx: Rollup.TransformPluginContext, code: string, importer: string) => {
    const imported = await findImportedLayerDeclaration(code, importer, {
      resolve: async (specifier, from) => {
        const resolved = await resolveCssImport(ctx, specifier, from)
        const file = resolved && !resolved.external ? cleanId(resolved.id) : undefined
        return file && isAbsolute(file) ? file : undefined
      },
      read: (file) => readFile(file, 'utf8'),
      hasLayerDeclaration: (css) => driver!.compiler.hasLayerDeclaration(css),
    })
    for (const file of imported.files) ctx.addWatchFile(file)
    return imported.found
  }

  const plugin: Plugin = {
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

    transform: {
      order: 'pre',
      handler(code, id) {
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
            warnDiagnostics((message) => this.warn(message), sourceResult.diagnostics, 'while transforming source', {
              file: id.split('?')[0] ?? id,
              onlyNew: true,
            })
            return { code: sourceResult.code, map: sourceResult.map }
          }
        }

        if (!driver || extname(cleanId(id)) !== '.css') return null
        if (driver.compiler.hasLayerDeclaration(code)) return injectStylesheet(this, code, id)
        if (!code.includes('@import')) return null

        return importsLayerDeclaration(this, code, cleanId(id)).then((found) =>
          found ? injectStylesheet(this, code, id) : null,
        )
      },
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
          if (designSystemFile === 'artifact') {
            watchedFiles.clear()
            codegen()
          }
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
          { file: ctx.file },
        )
        return withInvalidatedRoots(this.environment, ctx.modules)
      }

      return ctx.modules
    },
  }

  const polyfillPlugin: Plugin = {
    name: 'pandacss:polyfill',
    transform(code, id) {
      if (driver?.config.polyfill !== true || !rootIds.has(id)) return null
      const stripped = driver.compiler.stripLayerOrderStatements(code)
      return stripped === code ? null : { code: stripped, map: null }
    },
  }

  return [plugin, polyfillPlugin]
}

function cleanId(id: string) {
  return id.split('?')[0] ?? id
}

async function resolveCssImport(ctx: Rollup.TransformPluginContext, specifier: string, importer: string) {
  if (!/^[./]/.test(specifier)) {
    const relative = await ctx.resolve(`./${specifier}`, importer, { skipSelf: true })
    if (relative) return relative
  }
  return ctx.resolve(specifier, importer, { skipSelf: true })
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
