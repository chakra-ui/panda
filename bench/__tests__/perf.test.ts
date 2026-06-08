// @vitest-environment node
/**
 * Fair perf comparison, setup excluded. Both sides get the SAME resolved fixture
 * config and the SAME synthetic source corpus. We time (a) cold pass = parse
 * every file once, (b) warm pass = re-parse the largest file N times.
 */
import { performance } from 'node:perf_hooks'
import { test } from 'vitest'
import { createContext } from '@pandacss/fixture'
import { createCompilerFromSnapshot } from '@pandacss/compiler'
import { createConfigSnapshot } from '@pandacss/config-loader'

function synth(i: number): string {
  const c = ['red', 'blue', 'green', 'gray'][i % 4]
  return `import { css, cva } from 'styled-system/css'
import { styled, Stack, HStack } from 'styled-system/jsx'
import { stack, hstack } from 'styled-system/patterns'
const r = cva({ base: { color: '${c}.500', px: '4' }, variants: { size: { sm: { fontSize: 'sm' }, lg: { fontSize: 'xl' } } }, defaultVariants: { size: 'sm' } })
const s = css({ display: 'flex', gap: '4', p: { base: '4', md: '6' }, bg: '${c}.100', _hover: { bg: '${c}.200' }, _dark: { bg: '${c}.800' } })
export const C${i} = () => (
  <Stack gap="4" align="center" className={s}>
    <styled.h1 fontSize="3xl" color="${c}.700">Hi ${i}</styled.h1>
    <HStack gap="2"><div className={r({ size: 'lg' })}>x</div></HStack>
    <div className={css({ color: 'gray.500', mb: '2' })}>label</div>
  </Stack>
)
`
}

test('perf: cold + warm', () => {
  const N = 100
  const WARM = 200
  const ctx = createContext() as any
  const snapshot = createConfigSnapshot(ctx.config)
  const sources = Array.from({ length: N }, (_, i) => ({ path: `/proj/src/C${i}.tsx`, content: synth(i) }))
  const largest = sources[0]

  // ---- legacy cold ----
  const lEnc = ctx.encoder.clone()
  for (const s of sources) ctx.project.addSourceFile(s.path, s.content)
  let t = performance.now()
  for (const s of sources) ctx.project.parseSourceFile(s.path, lEnc)
  const legacyCold = +(performance.now() - t).toFixed(1)

  // ---- legacy warm ----
  t = performance.now()
  for (let i = 0; i < WARM; i++) ctx.project.parseSourceFile(largest.path, lEnc)
  const legacyWarm = +(((performance.now() - t) / WARM) * 1000).toFixed(1) // µs/call

  // ---- v2 cold ----
  const compiler = createCompilerFromSnapshot(snapshot, { crossFile: true }) as any
  t = performance.now()
  for (const s of sources) compiler.parseFileSource(s.path, s.content)
  const v2Cold = +(performance.now() - t).toFixed(1)
  t = performance.now()
  compiler.compile()
  const v2Emit = +(performance.now() - t).toFixed(1)

  // ---- v2 warm ----
  t = performance.now()
  for (let i = 0; i < WARM; i++) compiler.parseFileSource(largest.path, largest.content)
  const v2Warm = +(((performance.now() - t) / WARM) * 1000).toFixed(1) // µs/call

  // legacy emit for reference
  const decoder = ctx.decoder.clone().collect(lEnc)
  t = performance.now()
  ctx.getParserCss(decoder)
  const legacyEmit = +(performance.now() - t).toFixed(1)

  // eslint-disable-next-line no-console
  console.log(`\n##### PERF (${N} files, ${WARM} warm iters) #####
COLD parse-all:  legacy ${legacyCold}ms   v2 ${v2Cold}ms   → ${(legacyCold / v2Cold).toFixed(1)}× faster
WARM parse/file: legacy ${legacyWarm}µs   v2 ${v2Warm}µs   → ${(legacyWarm / v2Warm).toFixed(1)}× faster
EMIT css:        legacy ${legacyEmit}ms   v2 ${v2Emit}ms`)
}, 120_000)
