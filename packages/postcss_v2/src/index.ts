import { createNodeDriver, type Driver } from '@pandacss/compiler'
import { extname, normalize, resolve } from 'node:path'
import type { Message, PluginCreator, Result, Root, TransformCallback } from 'postcss'

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
}

const driverStates = new Map<string, DriverState>()
let driverGuard: Promise<void> | undefined

export const pandacss: PluginCreator<PluginOptions> = (options = {}) => {
  const postcssProcess: TransformCallback = async (root, result) => {
    const fileName = result.opts.from

    if (shouldSkip(fileName, options.allow)) return

    const inputCss = getInputCss(root, result)
    if (!inputCss.includes('@layer')) return

    const cwd = resolve(options.cwd ?? process.cwd())
    const key = getDriverKey(cwd, options.configPath)

    let state = driverStates.get(key)
    if (!state) {
      const driver = await createNodeDriver({ cwd, configPath: options.configPath })
      state = { driver, generatedOutdirs: new Set() }
      driverStates.set(key, state)
    } else {
      const diff = await state.driver.reload()
      if (diff.hasChanged) {
        state.generatedOutdirs.clear()
      }
    }

    const { driver } = state

    if (!driver.compiler.hasLayerDeclaration(inputCss)) return

    ensureCodegen(state, { cwd, outdir: options.outdir })
    driver.parseFiles()
    registerDependencies(driver, result, cwd, fileName)

    const output = driver.cssgen({ emitLayerDeclaration: false })
    emitDiagnostics(result, output.diagnostics)
    root.append(output.css)

    root.walk((node) => {
      if (!node.source) {
        node.source = root.source
      }
    })
  }

  return {
    postcssPlugin: PLUGIN_NAME,
    plugins: [
      function (...args) {
        driverGuard = Promise.resolve(driverGuard)
          .catch(() => {
            /** keep the queue alive after a failed run */
          })
          .then(() => postcssProcess(...args))
        return driverGuard
      },
    ],
  }
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

function registerDependencies(driver: Driver, result: Result, cwd: string, parent: string | undefined) {
  for (const source of driver.compiler.sources()) {
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

  const configDeps = new Set(driver.configDependencies.map((file) => normalize(resolve(cwd, file))))
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

function emitDiagnostics(result: Result, diagnostics: { message: string }[]) {
  for (const diagnostic of diagnostics) {
    result.warn(diagnostic.message, { plugin: PLUGIN_NAME })
  }
}
