import { Builder, setLogStream } from '@pandacss/node'
import { createRequire } from 'module'
import path from 'path'
import type { PluginCreator, TransformCallback } from 'postcss'

const customRequire = createRequire(import.meta.url)

const PLUGIN_NAME = 'pandacss'

export interface PluginOptions {
  configPath?: string
  cwd?: string
  logfile?: string
  allow?: RegExp[]
}

const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

export const loadConfig = () => interopDefault(customRequire('@pandacss/postcss'))

let stream: ReturnType<typeof setLogStream> | undefined

// export for unit test
export const builder = new Builder()
let builderGuard: Promise<void> | undefined

export const pandacss: PluginCreator<PluginOptions> = (options = {}) => {
  const { configPath, cwd, logfile, allow } = options

  if (!stream && logfile) {
    stream = setLogStream({ cwd, logfile })
  }
  const postcssProcess: TransformCallback = async function (root, result) {
    const fileName = result.opts.from

    const skip = shouldSkip(fileName, allow)
    if (skip) return

    await builder.setup({ configPath, cwd })

    // ignore non-panda css file
    if (!builder.isValidRoot(root)) return

    await builder.emit()

    builder.extract()

    builder.registerDependency((dep) => {
      result.messages.push({
        ...dep,
        plugin: PLUGIN_NAME,
        parent: result.opts.from,
      })
    })

    builder.write(root)

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
        builderGuard = Promise.resolve(builderGuard)
          .catch(() => {
            /**/
          })
          .then(() => postcssProcess(...args))
        return builderGuard
      },
    ],
  }
}

pandacss.postcss = true

export default pandacss
// node's require(esm) returns this value directly instead of the namespace object,
// so cjs consumers (next.js postcss config, postcss.config.cjs) get the callable plugin
export { pandacss as 'module.exports' }

const nodeModulesRegex = /node_modules/

function isValidCss(file: string) {
  const [filePath] = file.split('?')
  return path.extname(filePath) === '.css'
}

const shouldSkip = (fileName: string | undefined, allow: PluginOptions['allow']) => {
  if (!fileName) return true
  if (!isValidCss(fileName)) return true
  if (allow?.some((p) => p.test(fileName))) return false
  return nodeModulesRegex.test(fileName)
}
