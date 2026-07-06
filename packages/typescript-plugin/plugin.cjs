// Static, hand-written — not built by tsup. tsserver's plugin loader does a plain
// CommonJS `require()` and needs `module.exports` to literally be the callable
// factory. The compiled `dist/index.cjs` exports `{ default: factory, ... }` (esbuild's
// ESM-to-CJS interop shape), which real tsserver could not call directly — confirmed
// via a real tsserver process logging "did not expose a proper factory function"
// before this shim existed. This unwraps it.
module.exports = require('./dist/index.cjs').default
