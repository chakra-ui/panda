import { Builder } from '@pandacss/node'
import type { PluginCreator } from 'postcss'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const PLUGIN_NAME = 'pandacss'

const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

export const loadConfig = () => {
  return interopDefault(require('@pandacss/postcss'))
}

export const pandacss: PluginCreator<{}> = () => {
  const builder = new Builder()

  return {
    postcssPlugin: PLUGIN_NAME,
    plugins: [
      async function (root, result) {
        // ignore non-panda file
        if (!builder.isValidRoot(root)) {
          return
        }

        await builder.setup()
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
