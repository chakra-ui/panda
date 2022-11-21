/* eslint-disable @typescript-eslint/no-var-requires */
const { Builder } = require('@pandacss/node')

const PLUGIN_NAME = 'pandaCss'

function postcssPlugin() {
  const builder = new Builder()

  return {
    postcssPlugin: PLUGIN_NAME,
    async Once(root, { result }) {
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
          node.source = { input: { file: result.opts.from } }
        }
      })
    },
  }
}

postcssPlugin.postcss = true

module.exports = postcssPlugin
