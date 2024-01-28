import { createLogger } from '@pandacss/logger'
import { Builder, createLogStream } from '@pandacss/node'
import { createRequire } from 'module'
import path from 'path'
import type { PluginCreator } from 'postcss'

const customRequire = createRequire(__dirname)
const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)
export const loadConfig = () => interopDefault(customRequire('@pandacss/postcss'))

const debugVar = process.env.PANDA_DEBUG || process.env.DEBUG
const isDebug = Boolean(debugVar)
const logger = createLogger({ filter: debugVar, isDebug })
const builder = new Builder({ logger })

interface PluginOptions {
  configPath?: string
  cwd?: string
  logfile?: string
}

const PLUGIN_NAME = 'pandacss'

let stream: ReturnType<typeof createLogStream> | undefined

export const pandacss: PluginCreator<PluginOptions> = (options = {}) => {
  const { configPath, cwd, logfile } = options

  if (!stream && logfile) {
    stream = createLogStream({ cwd: cwd ?? process.cwd(), logfile })
  }

  return {
    postcssPlugin: PLUGIN_NAME,
    plugins: [
      async function (root, result) {
        const fileName = result.opts.from

        const skip = shouldSkip(fileName)
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
      },
    ],
  }
}

pandacss.postcss = true

export default pandacss

const nodeModulesRegex = /node_modules/

function isValidCss(file: string) {
  const [filePath] = file.split('?')
  return path.extname(filePath) === '.css'
}

const shouldSkip = (fileName: string | undefined) => {
  if (!fileName) return true
  if (!isValidCss(fileName)) return true
  return nodeModulesRegex.test(fileName)
}

process.once('SIGINT', () => {
  stream?.onClean()
})
