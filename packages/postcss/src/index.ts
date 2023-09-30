import { Builder } from '@pandacss/node'
import type { PluginCreator } from 'postcss'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const PLUGIN_NAME = 'pandacss'

const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

export const loadConfig = () => interopDefault(require('@pandacss/postcss'))

interface PluginOptions {
  configPath?: string
  cwd?: string
  silent?: boolean
}

export const pandacss: PluginCreator<PluginOptions> = (options = {}) => {
  const { configPath, cwd, silent } = options
  const builder = new Builder({ logLevel: silent ? 'silent' : undefined })

  return {
    postcssPlugin: PLUGIN_NAME,
    plugins: [
      async function (root, result) {
        await builder.setup({ configPath, cwd })

        // ignore non-panda css file
        if (!builder.isValidRoot(root)) {
          return
        }

        await builder.extract()

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
