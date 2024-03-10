import { Builder, setLogStream } from '@pandacss/node'
import { createRequire } from 'module'
import path from 'path'
import type { PluginCreator } from 'postcss'

const customRequire = createRequire(__dirname)

const PLUGIN_NAME = 'pandacss'

export interface PluginOptions {
  configPath?: string
  cwd?: string
  logfile?: string
}

const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

export const loadConfig = () => interopDefault(customRequire('@pandacss/postcss'))

let stream: ReturnType<typeof setLogStream> | undefined

const builder = new Builder()

export const pandacss: PluginCreator<PluginOptions> = (options = {}) => {
  const { configPath, cwd, logfile } = options

  if (!stream && logfile) {
    stream = setLogStream({ cwd, logfile })
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
// Embroider virtualizes files inside of `/node_modules/.embroider/rewritten-app`
const nodeModulesEmbroiderRegex = /node_modules\/.embroider/

function isValidCss(file: string) {
  const [filePath] = file.split('?')
  return path.extname(filePath) === '.css'
}

const shouldSkip = (fileName: string | undefined) => {
  if (!fileName) return true
  if (!isValidCss(fileName)) return true
  return nodeModulesRegex.test(fileName) && !nodeModulesEmbroiderRegex.test(fileName)
}
