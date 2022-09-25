/* eslint-disable @typescript-eslint/no-var-requires */
const { Builder } = require('@css-panda/node')

const PLUGIN_NAME = 'css:panda'

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
    },
  }
}

postcssPlugin.postcss = true

module.exports = postcssPlugin
