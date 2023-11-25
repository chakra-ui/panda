import { Builder } from '@pandacss/node'
import type { PluginCreator } from 'postcss'
import { createRequire } from 'module'

const customRequire = createRequire(__dirname)

const PLUGIN_NAME = 'pandacss'

const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

export const loadConfig = () => interopDefault(customRequire('@pandacss/postcss'))

const builder = new Builder()

export const pandacss: PluginCreator<{ configPath?: string; cwd?: string }> = (options = {}) => {
  const { configPath, cwd } = options

  return {
    postcssPlugin: PLUGIN_NAME,
    plugins: [
      async function (root, result) {
        await builder.setup({ configPath, cwd })

        // ignore non-panda css file
        if (!builder.isValidRoot(root)) {
          return
        }

        await builder.emit()

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
