/* eslint-disable @typescript-eslint/no-require-imports */
// CommonJS entry: `require()`-based loaders (Next.js, postcss-load-config)
// expect the plugin creator as `module.exports`, not under `.default`.
const mod = require('./dist/index.cjs')

module.exports = mod.default
module.exports.pandacss = mod.pandacss
module.exports.default = mod.default
