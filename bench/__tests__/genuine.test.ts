// @vitest-environment node
/**
 * Fully genuine comparison: legacy node pipeline vs v2 via its OWN config
 * (createNodeDriver). No cross-feeding — both load the config from disk the way
 * the real product does. Only runs on sandboxes whose config v2 can load.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { format as formatCss } from '@projectwallace/format-css'
import { test } from 'vitest'
import { loadConfigAndCreateContext } from '@pandacss/node'
import { createNodeDriver } from '@pandacss/compiler'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const outDir = resolve(repoRoot, 'bench/.parity-out')

// sandboxes where v2's genuine path still diverges from legacy (mainly missing preset auto-injection)
const TARGETS = ['sandbox/solid-ts']

function fmt(css: string) {
  try {
    return formatCss(css)
  } catch {
    return css
  }
}

function setDiff(a: string, b: string) {
  const na = a.split('\n').map((l) => l.trim()).filter(Boolean)
  const nb = b.split('\n').map((l) => l.trim()).filter(Boolean)
  const ca = new Map<string, number>()
  const cb = new Map<string, number>()
  for (const l of na) ca.set(l, (ca.get(l) ?? 0) + 1)
  for (const l of nb) cb.set(l, (cb.get(l) ?? 0) + 1)
  const onlyA: string[] = []
  const onlyB: string[] = []
  for (const [k, c] of ca) if (c - (cb.get(k) ?? 0) > 0) onlyA.push(k)
  for (const [k, c] of cb) if (c - (ca.get(k) ?? 0) > 0) onlyB.push(k)
  return { onlyA, onlyB }
}

test('genuine legacy vs v2-driver', async () => {
  mkdirSync(outDir, { recursive: true })
  for (const rel of TARGETS) {
    const cwd = resolve(repoRoot, rel)
    const slug = rel.replace(/\//g, '_')

    const l0 = performance.now()
    const ctx = (await loadConfigAndCreateContext({ cwd })) as any
    const sheet = ctx.createSheet()
    ctx.parseFiles()
    ctx.appendLayerParams(sheet)
    ctx.appendBaselineCss(sheet)
    ctx.appendParserCss(sheet)
    const legacy = fmt(ctx.getCss(sheet))
    const legacyMs = +(performance.now() - l0).toFixed(1)

    const v0 = performance.now()
    const driver = await createNodeDriver({ cwd })
    const scanned = driver.scan()
    driver.parseFiles()
    const v2 = fmt(driver.cssgen().css)
    const v2Ms = +(performance.now() - v0).toFixed(1)

    writeFileSync(resolve(outDir, `${slug}.genuine.legacy.css`), legacy)
    writeFileSync(resolve(outDir, `${slug}.genuine.v2.css`), v2)

    const { onlyA, onlyB } = setDiff(legacy, v2)
    // eslint-disable-next-line no-console
    console.log(
      `\n### ${rel} | files legacy?=disk v2=${scanned.length} | legacy ${legacyMs}ms ${legacy.length}B vs v2 ${v2Ms}ms ${v2.length}B\n` +
        `ONLY IN LEGACY (${onlyA.length}):\n${onlyA.slice(0, 50).join('\n')}\n\n` +
        `ONLY IN V2 (${onlyB.length}):\n${onlyB.slice(0, 50).join('\n')}`,
    )
  }
}, 120_000)
