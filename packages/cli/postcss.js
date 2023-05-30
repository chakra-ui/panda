/* eslint-disable @typescript-eslint/no-var-requires */
const { Builder } = require('@pandacss/node')

const PLUGIN_NAME = 'pandacss'

module.exports = function pandacss() {
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
            node.source = { input: { file: result.opts.from } }
          }
        })
      },
    ],
  }
}

module.exports.postcss = true
