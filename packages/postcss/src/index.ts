import { createNodeDriver } from '@pandacss/compiler'
import { type Diagnostic, type Driver, formatDiagnostic, type SourceChange } from '@pandacss/compiler-shared'
import { extname, normalize, resolve } from 'node:path'
import type { ChildNode, Helpers, Message, Plugin, PluginCreator, Result, Root } from 'postcss'
import { readFileStamp } from './fs-stamp'

const PLUGIN_NAME = 'pandacss'

export interface PluginOptions {
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Project root. Defaults to the current working directory. */
  cwd?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
  /** Allow selected `node_modules` CSS files through the processing guard. */
  allow?: RegExp[]
}

interface DriverState {
  driver: Driver
  generatedOutdirs: Set<string>
  parsedSources: Map<string, string>
  configStamp: string
  dsSourceStamp: string
}

const driverStates = new Map<string, DriverState>()
let driverGuard: Promise<void> | undefined

const pandacss: PluginCreator<PluginOptions> = (options: PluginOptions = {}) => {
  const postcssProcess = async (root: Root, helpers: Helpers) => {
    const result = helpers.result
    const fileName = result.opts.from

    if (shouldSkip(fileName, options.allow)) return

    const inputCss = getInputCss(root, result)
    if (!inputCss.includes('@layer')) return

    const cwd = resolve(options.cwd ?? process.cwd())
    const key = getDriverKey(cwd, options.configPath)

    let state = driverStates.get(key)
    if (!state) {
      const driver = await createNodeDriver({ cwd, configPath: options.configPath })
      state = {
        driver,
        generatedOutdirs: new Set(),
        parsedSources: new Map(),
        configStamp: stampPaths(configStampPaths(driver)),
        dsSourceStamp: stampPaths(dsSourceStampPaths(driver)),
      }
      driverStates.set(key, state)
      driver.syncDesignSystemSources()
    } else {
      await syncDriverState(state)
    }

    const { driver } = state
    const polyfill = driver.config.polyfill === true

    if (!driver.compiler.hasLayerDeclaration(inputCss)) return

    ensureCodegen(state, { cwd, outdir: options.outdir })
    syncProjectSources(state)
    registerDependencies(driver, result, cwd, fileName)
    emitDiagnostics(root, result, driver.designSystemDiagnostics ?? [])

    if (polyfill) {
      const stripped = driver.compiler.stripLayerOrderStatements(inputCss)
      root.removeAll()
      root.append(helpers.postcss.parse(stripped, { from: fileName }))
    }

    const output = driver.cssgen({ emitLayerDeclaration: false, polyfill })
    emitDiagnostics(root, result, output.diagnostics)
    root.append(output.css)

    root.walk((node: ChildNode) => {
      if (!node.source) {
        node.source = root.source
      }
    })
  }

  return {
    postcssPlugin: PLUGIN_NAME,
    Once(root: Root, helpers: Helpers) {
      driverGuard = Promise.resolve(driverGuard)
        .catch(() => {
          /** keep the queue alive after a failed run */
        })
        .then(() => postcssProcess(root, helpers))
      return driverGuard
    },
  } satisfies Plugin
}

pandacss.postcss = true

export default pandacss

const nodeModulesRegex = /node_modules/

function isValidCss(file: string) {
  const [filePath] = file.split('?')
  return extname(filePath) === '.css'
}

const shouldSkip = (fileName: string | undefined, allow: PluginOptions['allow']) => {
  if (!fileName) return true
  if (!isValidCss(fileName)) return true
  if (allow?.some((pattern) => pattern.test(fileName))) return false
  return nodeModulesRegex.test(fileName)
}

function getDriverKey(cwd: string, configPath: string | undefined) {
  return `${cwd}:${configPath ?? ''}`
}

function getInputCss(root: Root, result: Result) {
  const opts = result.opts as Result['opts'] & { css?: string }
  return opts.css ?? root.toString()
}

function ensureCodegen(state: DriverState, options: { cwd: string; outdir: string | undefined }) {
  const outdirKey = state.driver.getOutdir(options.outdir)
  if (state.generatedOutdirs.has(outdirKey)) return

  state.driver.codegen({ cwd: options.cwd, outdir: options.outdir })
  state.generatedOutdirs.add(outdirKey)
}

async function syncDriverState(state: DriverState) {
  const nextConfigStamp = stampPaths(configStampPaths(state.driver))
  if (state.configStamp !== nextConfigStamp) {
    const diff = await state.driver.reload()
    state.configStamp = stampPaths(configStampPaths(state.driver))
    if (diff.hasChanged) {
      state.generatedOutdirs.clear()
      state.parsedSources.clear()
    }
    state.driver.syncDesignSystemSources()
    state.dsSourceStamp = stampPaths(dsSourceStampPaths(state.driver))
    return
  }

  const nextDsSourceStamp = stampPaths(dsSourceStampPaths(state.driver))
  if (state.dsSourceStamp !== nextDsSourceStamp) {
    state.driver.syncDesignSystemSources()
    state.dsSourceStamp = nextDsSourceStamp
  }
}

function syncProjectSources(state: DriverState) {
  const files = state.driver.scan()
  const scanned = new Set(files)
  const changes: SourceChange[] = []

  for (const path of state.parsedSources.keys()) {
    if (!scanned.has(path)) {
      changes.push({ path, kind: 'unlink' })
      state.parsedSources.delete(path)
    }
  }

  for (const path of files) {
    const stamp = readFileStamp(path)
    const known = state.parsedSources.get(path)
    if (known === undefined) {
      changes.push({ path, kind: 'add' })
      state.parsedSources.set(path, stamp)
      continue
    }
    if (known !== stamp) {
      changes.push({ path, kind: 'change' })
      state.parsedSources.set(path, stamp)
    }
  }

  if (changes.length > 0) {
    state.driver.applyChanges(changes)
  }
}

function configStampPaths(driver: Driver): string[] {
  const paths: string[] = []
  if (driver.configPath) paths.push(driver.configPath)
  for (const dep of driver.configDependencies) {
    paths.push(driver.resolvePath(dep))
  }
  for (const target of driver.designSystemWatchTargets?.() ?? []) {
    paths.push(target.manifestPath, target.buildInfoPath, target.presetPath)
  }
  return paths
}

function dsSourceStampPaths(driver: Driver): string[] {
  const paths: string[] = []
  for (const target of driver.designSystemWatchTargets?.() ?? []) {
    for (const file of target.sourceFiles) paths.push(file)
  }
  return paths
}

function stampPaths(paths: string[]): string {
  if (paths.length === 0) return ''
  let stamp = ''
  for (let i = 0; i < paths.length; i++) {
    if (i) stamp += '\0'
    stamp += `${paths[i]}\0${readFileStamp(paths[i]!)}`
  }
  return stamp
}

function registerDependencies(driver: Driver, result: Result, cwd: string, parent: string | undefined) {
  for (const source of driver.compiler.sources()) {
    // `pattern` is already relative to `base` — the shape a `dir-dependency` wants.
    result.messages.push(
      withPluginMetadata(
        createSourceDependency({
          dir: normalize(resolve(cwd, source.base)),
          glob: source.pattern,
        }),
        parent,
      ),
    )
  }

  const configDeps = new Set(driver.configDependencies.map((file: string) => normalize(resolve(cwd, file))))
  if (driver.configPath) {
    configDeps.add(normalize(resolve(cwd, driver.configPath)))
  }

  for (const file of configDeps) {
    result.messages.push(
      withPluginMetadata(
        {
          type: 'dependency',
          file,
        },
        parent,
      ),
    )
  }

  for (const target of driver.designSystemWatchTargets?.() ?? []) {
    for (const file of [target.manifestPath, target.buildInfoPath, target.presetPath, ...target.sourceFiles]) {
      result.messages.push(
        withPluginMetadata(
          {
            type: 'dependency',
            file: normalize(file),
          },
          parent,
        ),
      )
    }
  }
}

function createSourceDependency(source: { dir: string; glob: string }): Message {
  if (process.env.ROLLUP_WATCH === 'true') {
    return { type: 'dependency', file: source.dir }
  }

  return { type: 'dir-dependency', dir: source.dir, glob: source.glob }
}

function withPluginMetadata(message: Message, parent: string | undefined): Message {
  return {
    ...message,
    plugin: PLUGIN_NAME,
    parent,
  }
}

function emitDiagnostics(root: Root, result: Result, diagnostics: Diagnostic[]) {
  const error = diagnostics.find((diagnostic) => diagnostic.severity === 'error')
  if (error) {
    throw root.error(formatDiagnostic(error), { plugin: PLUGIN_NAME })
  }

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === 'info') {
      result.messages.push({ type: 'pandacss-diagnostic', plugin: PLUGIN_NAME, diagnostic })

      continue
    }

    result.warn(formatDiagnostic(diagnostic), { plugin: PLUGIN_NAME })
  }
}
