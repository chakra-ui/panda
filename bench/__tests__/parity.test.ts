// @vitest-environment node
/**
 * End-to-end parity + perf comparison: legacy TS pipeline vs v2 Rust engine.
 * Both load the SAME panda.config.ts from the SAME cwd over the SAME sources.
 *
 *   legacy: @pandacss/node     loadConfigAndCreateContext → parseFiles → getCss
 *   v2:     @pandacss/compiler createNodeDriver → scan → parseFiles → cssgen
 *
 * Run: pnpm test bench/__tests__/parity.test.ts
 * Writes per-project formatted CSS + a JSON summary to bench/.parity-out/.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { format as formatCss } from '@projectwallace/format-css'
import { test } from 'vitest'
import { loadConfigAndCreateContext } from '@pandacss/node'
import { createCompilerFromSnapshot } from '@pandacss/compiler'
import { createConfigSnapshot } from '@pandacss/config-loader'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const outDir = resolve(repoRoot, 'bench/.parity-out')

const TARGETS = [
  'sandbox/vite-ts',
  'sandbox/next-js-app',
  'sandbox/next-js-pages',
  'sandbox/solid-ts',
  'sandbox/preact-ts',
  'sandbox/qwik-ts',
  'sandbox/remix',
  'sandbox/storybook',
  'sandbox/vite-react-postcss',
  'sandbox/nuxt',
  'sandbox/svelte',
  'sandbox/astro',
]

function safeFormat(css: string): string {
  try {
    return formatCss(css)
  } catch {
    return css
  }
}

function countSelectors(css: string): number {
  return (css.match(/\{/g) ?? []).length
}

function diffLineCount(a: string, b: string): number {
  const al = a.split('\n')
  const bl = b.split('\n')
  const max = Math.max(al.length, bl.length)
  let diff = 0
  for (let i = 0; i < max; i++) if (al[i] !== bl[i]) diff++
  return diff
}

test('parity sweep', async () => {
  mkdirSync(outDir, { recursive: true })
  const results: any[] = []

  for (const rel of TARGETS) {
    const cwd = resolve(repoRoot, rel)
    const slug = rel.replace(/\//g, '_')
    const r: any = { cwd: rel }
    try {
      // --- shared inputs: one resolved config + one file list ---
      const ctx = (await loadConfigAndCreateContext({ cwd })) as any
      const filePaths: string[] = ctx.getFiles()
      const sources = filePaths.map((p) => ({ path: p, content: readFileSync(p, 'utf8') }))
      r.files = sources.length

      // --- legacy: ts-morph parse + sheet assembly ---
      const lStart = performance.now()
      const sheet = ctx.createSheet()
      ctx.parseFiles()
      ctx.appendLayerParams(sheet)
      ctx.appendBaselineCss(sheet)
      ctx.appendParserCss(sheet)
      const legacy = ctx.getCss(sheet) as string
      r.legacyMs = +(performance.now() - lStart).toFixed(1)

      // --- v2: same resolved config (bypass config-loader bundle bug) ---
      const snapshot = createConfigSnapshot(ctx.config)
      const vStart = performance.now()
      const compiler = createCompilerFromSnapshot(snapshot, { crossFile: true })
      for (const s of sources) compiler.parseFileSource(s.path, s.content)
      const v2 = compiler.compile().css as string
      r.v2Ms = +(performance.now() - vStart).toFixed(1)

      const lFmt = safeFormat(legacy)
      const vFmt = safeFormat(v2)
      r.legacyBytes = Buffer.byteLength(legacy)
      r.v2Bytes = Buffer.byteLength(v2)
      r.legacySelectors = countSelectors(lFmt)
      r.v2Selectors = countSelectors(vFmt)
      r.identical = lFmt === vFmt
      r.diffLines = r.identical ? 0 : diffLineCount(lFmt, vFmt)
      r.speedup = r.v2Ms > 0 ? +(r.legacyMs / r.v2Ms).toFixed(2) : null

      writeFileSync(resolve(outDir, `${slug}.legacy.css`), lFmt)
      writeFileSync(resolve(outDir, `${slug}.v2.css`), vFmt)
    } catch (err) {
      r.error = String((err as Error)?.message ?? err)
    }
    results.push(r)
    // eslint-disable-next-line no-console
    console.log(
      r.error
        ? `${rel}: ERROR — ${r.error}`
        : `${rel}: ${r.identical ? '✅ IDENTICAL' : `❌ ${r.diffLines} diff lines`} | files=${r.files} | legacy ${r.legacyMs}ms/${r.legacyBytes}B/${r.legacySelectors}sel vs v2 ${r.v2Ms}ms/${r.v2Bytes}B/${r.v2Selectors}sel | ${r.speedup}× faster`,
    )
  }

  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(results, null, 2))
}, 120_000)
