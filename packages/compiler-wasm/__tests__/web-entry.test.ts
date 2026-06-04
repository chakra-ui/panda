/**
 * Regression test: the browser entry `dist/web.mjs` must be shim-free across its
 * WHOLE module graph — no `fileURLToPath` / `init_esm_shims` in `web.mjs` OR in
 * any chunk it imports (including side-effect `import "./chunk-*.mjs"`). tsup's
 * `--shims` injects a shared shim chunk that every entry side-effect-imports, so
 * checking `web.mjs` alone gives a false pass — the browser entry is built in a
 * separate, shimless tsup config (see `tsup.config.ts`). When the shim strings
 * are absent from the closure, a browser bundler that stubs `node:url` will not
 * throw at module-eval time.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIST = resolve(__dirname, '..', 'dist')
const WEB_MJS = resolve(DIST, 'web.mjs')
const builtGuard = existsSync(WEB_MJS)

/** All `.mjs` files reachable from `entry` via static + side-effect imports. */
function moduleGraph(entry: string): string[] {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length) {
    const file = queue.pop()!
    if (seen.has(file) || !existsSync(file)) continue
    seen.add(file)
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/(?:from\s*|import\s*)["'](\.\/[^"']+\.mjs)["']/g)) {
      queue.push(resolve(dirname(file), m[1]))
    }
  }
  return [...seen]
}

describe.skipIf(!builtGuard)('@pandacss/compiler-wasm browser entry is shim-free', () => {
  it('web.mjs module graph contains no fileURLToPath / esm shim', () => {
    const graph = moduleGraph(WEB_MJS)
    const tainted = graph.filter((f) => {
      const src = readFileSync(f, 'utf8')
      return src.includes('fileURLToPath') || src.includes('init_esm_shims')
    })
    expect(tainted).toEqual([])
  })
})

describe.skipIf(builtGuard)('@pandacss/compiler-wasm browser entry is shim-free', () => {
  it.skip('dist not built — run `pnpm --filter @pandacss/compiler-wasm build` first', () => {
    // placeholder — shows as skipped in CI so the build prerequisite is visible.
  })
})
