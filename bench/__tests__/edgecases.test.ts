// @vitest-environment node
/**
 * Emitter-parity battery. Legacy (fixture PandaContext) and v2
 * (createCompilerFromSnapshot of the SAME resolved fixture config) consume
 * identical in-memory sources. We compare the from-source CSS (utilities +
 * recipes layers) so reset/token-layer/hook differences don't pollute the diff.
 *
 * The fixture config is a clean nested-`{value}` UserConfig, so this isolates
 * the v2 encoder/emitter from config-loader incompleteness and from the
 * sandbox-config-shape artifacts seen in the e2e sweep.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { format as formatCss } from '@projectwallace/format-css'
import { test } from 'vitest'
import { createContext } from '@pandacss/fixture'
import { createCompilerFromSnapshot } from '@pandacss/compiler'
import { createConfigSnapshot } from '@pandacss/config-loader'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const outDir = resolve(repoRoot, 'bench/.parity-out')

const IMPORTS = `import { css, cva } from 'styled-system/css'
import { stack, hstack } from 'styled-system/patterns'
import { styled, Stack } from 'styled-system/jsx'
import { token } from 'styled-system/tokens'
`

const CASES: Record<string, string> = {
  basic_tokens: `css({ color: 'red.500', marginBottom: '2', padding: 4, fontSize: '2xl' })`,
  shorthand: `css({ mb: '2', px: '4', bg: 'blue.300', w: '5', h: '5' })`,
  pseudo: `css({ color: 'red.500', _hover: { color: 'blue.500' }, _focusVisible: { color: 'green.500' } })`,
  responsive_obj: `css({ padding: { base: '2', md: '4', lg: '8' }, color: { base: 'red.500', _dark: 'blue.500' } })`,
  responsive_arr: `css({ padding: ['2', '4', '8'] })`,
  nested_cond: `css({ _hover: { _dark: { color: 'red.500' }, md: { color: 'blue.500' } } })`,
  important: `css({ color: 'red.500!', fontWeight: 'bold !important' })`,
  color_opacity: `css({ color: 'red.500/40', bg: 'blue.300/50' })`,
  negative: `css({ marginTop: '-2', left: '-4' })`,
  arbitrary_selector: `css({ '&[data-active]': { color: 'red.500' }, '& > p': { mb: '2' } })`,
  calc_raw: `css({ width: 'calc(100% - 20px)', maxWidth: '840px' })`,
  cva_recipe: `const x = cva({ base: { color: 'red.500', px: '4' }, variants: { size: { sm: { fontSize: 'sm' }, lg: { fontSize: 'xl' } }, tone: { muted: { color: 'gray.400' } } }, compoundVariants: [{ size: 'lg', tone: 'muted', css: { fontWeight: 'bold' } }], defaultVariants: { size: 'sm' } })`,
  jsx_styled: `const C = () => <styled.div color="red.500" mb="2" _hover={{ color: 'blue.500' }} />`,
  jsx_pattern: `const C = () => <Stack gap="4" align="center" />`,
  pattern_call: `stack({ gap: '4', align: 'center' })`,
  token_fn: `css({ color: token('colors.red.500'), boxShadow: '0 0 0 1px ' + token('colors.blue.300') })`,
  multiline_responsive: `css({ gap: { base: '4', sm: '6', md: '8', lg: '10', xl: '12' } })`,
  conditional_value: `css({ bg: { _hover: 'red.500', _active: 'blue.500', _disabled: 'gray.300' } })`,
  layer_style: `css({ textStyle: 'lg' })`,
  gradient: `css({ bgGradient: 'to-r', gradientFrom: 'red.200', gradientTo: 'blue.500' })`,
}

function fmt(css: string) {
  try {
    return formatCss(css)
  } catch {
    return css
  }
}

function lineSet(css: string) {
  const m = new Map<string, number>()
  for (const l of css.split('\n').map((s) => s.trim()).filter(Boolean)) m.set(l, (m.get(l) ?? 0) + 1)
  return m
}

function diff(a: string, b: string) {
  const ca = lineSet(a)
  const cb = lineSet(b)
  const onlyA: string[] = []
  const onlyB: string[] = []
  for (const [k, c] of ca) if (c - (cb.get(k) ?? 0) > 0) onlyA.push(k)
  for (const [k, c] of cb) if (c - (ca.get(k) ?? 0) > 0) onlyB.push(k)
  return { onlyA, onlyB }
}

test('emitter parity battery', () => {
  mkdirSync(outDir, { recursive: true })
  const ctx = createContext() as any
  const snapshot = createConfigSnapshot(ctx.config)

  const report: string[] = []
  let mismatches = 0

  for (const [name, body] of Object.entries(CASES)) {
    const src = `${IMPORTS}\n${body}\n`
    const path = `/virtual/${name}.tsx`

    // legacy
    let legacy = ''
    try {
      const encoder = ctx.encoder.clone()
      ctx.project.addSourceFile(path, src)
      ctx.project.parseSourceFile(path, encoder)
      const decoder = ctx.decoder.clone().collect(encoder)
      legacy = fmt(ctx.getParserCss(decoder) ?? '')
    } catch (e) {
      legacy = `LEGACY_ERROR: ${(e as Error).message}`
    }

    // v2
    let v2 = ''
    try {
      const compiler = createCompilerFromSnapshot(snapshot, { crossFile: true }) as any
      compiler.parseFileSource(path, src)
      v2 = fmt(compiler.layerCss(['recipes', 'utilities']) ?? '')
    } catch (e) {
      v2 = `V2_ERROR: ${(e as Error).message}`
    }

    const { onlyA, onlyB } = diff(legacy, v2)
    const ok = onlyA.length === 0 && onlyB.length === 0
    if (!ok) mismatches++
    report.push(
      `\n=== ${name} ${ok ? '✅' : '❌'} (legacy ${legacy.length}B / v2 ${v2.length}B) ===\n` +
        `SRC: ${body.slice(0, 100)}\n` +
        (ok
          ? ''
          : `  ONLY LEGACY (${onlyA.length}): ${onlyA.slice(0, 14).join(' | ')}\n` +
            `  ONLY V2     (${onlyB.length}): ${onlyB.slice(0, 14).join(' | ')}\n`),
    )
    writeFileSync(resolve(outDir, `case_${name}.legacy.css`), legacy)
    writeFileSync(resolve(outDir, `case_${name}.v2.css`), v2)
  }

  // eslint-disable-next-line no-console
  console.log(`\n##### EMITTER BATTERY: ${mismatches}/${Object.keys(CASES).length} mismatched #####\n${report.join('')}`)
}, 120_000)
