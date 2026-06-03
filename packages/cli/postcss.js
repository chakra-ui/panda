import plugin from '@pandacss/postcss'

const pandacss = plugin.default ?? plugin

export default pandacss
// see packages/postcss/src/index.ts — same require(esm) interop for cjs consumers
export { pandacss as 'module.exports' }
