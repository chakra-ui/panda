/**
 * Regression test: `dist/web.mjs` must be shim-free — no `fileURLToPath` or
 * `init_esm_shims` injected by tsup. When those strings are absent, a browser
 * bundler that stubs `node:url` will not throw at module-eval time.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const WEB_MJS = resolve(__dirname, '..', 'dist', 'web.mjs')

const builtGuard = existsSync(WEB_MJS)

describe.skipIf(!builtGuard)('@pandacss/compiler-wasm dist/web.mjs shim-free', () => {
  it('dist/web.mjs exists after build', () => {
    expect(existsSync(WEB_MJS)).toBe(true)
  })

  it('dist/web.mjs does not contain fileURLToPath', () => {
    const contents = readFileSync(WEB_MJS, 'utf8')
    expect(contents).not.toContain('fileURLToPath')
  })

  it('dist/web.mjs does not contain init_esm_shims', () => {
    const contents = readFileSync(WEB_MJS, 'utf8')
    expect(contents).not.toContain('init_esm_shims')
  })
})

describe.skipIf(builtGuard)('@pandacss/compiler-wasm dist/web.mjs shim-free', () => {
  it.skip('dist not built — run `pnpm --filter @pandacss/compiler-wasm build` first', () => {
    // placeholder — shows as skipped in CI so the build prerequisite is visible.
  })
})
