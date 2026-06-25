import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'

import type { ExtractResult } from '../src'

const PKG_NODE = resolve(__dirname, '..', 'pkg-node', 'compiler_wasm.js')

export const wasmAvailable = existsSync(PKG_NODE)

export function describeIfBuilt(name: string, fn: () => void) {
  return wasmAvailable ? describe(name, fn) : describe.skip(name, fn)
}

export const baseConfig = {
  cwd: '/virtual',
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  jsxFramework: 'react',
  jsxFactory: 'styled',
}

/// Strip span offsets from a result so snapshots don't churn when the
/// source string changes whitespace. Use when the test is about extraction
/// shape (calls/jsx/data) rather than precise byte locations.
export function withoutSpans(result: ExtractResult): unknown {
  return {
    calls: result.calls.map(({ span: _span, ...rest }) => rest),
    jsx: result.jsx.map(({ span: _span, ...rest }) => rest),
    diagnostics: result.diagnostics.map((d) => ({
      message: d.message,
      severity: d.severity,
    })),
  }
}

export function describeMissingWasm() {
  if (wasmAvailable) return
  describe('@pandacss/compiler-wasm', () => {
    it.skip('wasm bundle not built - run `pnpm --filter @pandacss/compiler-wasm build:wasm` first', () => {
      // placeholder body - the test is skipped; this is only here so the
      // skipped name shows up in CI output as a build prerequisite hint.
    })
  })
}
