/**
 * JS extractor vs Rust extractor — same fixtures, same matchers, two
 * paths. The JS path goes through `@pandacss/parser`'s `Project` (ts-morph
 * + custom visitor). The Rust path goes through `@pandacss/compiler`'s
 * `Extractor` session class (Oxc + native NAPI).
 *
 * Two modes:
 * - `--cwd <path>`: real project fixture. Loads `panda.config.ts`, globs
 *   include patterns, runs both paths over the actual sources on disk.
 * - `--synth <N>`: synthetic fixture. Generates N in-memory files with
 *   realistic Panda usage so the comparison scales beyond the small
 *   sandbox projects checked into the repo.
 *
 * Reports:
 * - Setup cost (one-time): `Project` warmup vs `Extractor` construction.
 * - Cold pass: parse every file once. Total wall + per-file mean.
 * - Warm pass: re-parse the largest file N times. Steady-state per-file cost.
 *
 * Notes on fairness:
 * - File I/O is excluded from both timers (sources are read upfront or
 *   generated in-memory).
 * - Both paths receive identical source strings keyed by the same path.
 * - The JS path runs the full encoder-result extraction (matches
 *   `context.parseFile()`), so the comparison reflects the cost a real
 *   build pipeline pays.
 */

import { performance } from 'node:perf_hooks'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import pandaNode from '../../packages/node/src/index.ts'
import bindingDefault from '../../packages/compiler/src/index.ts'
import type * as bindingTypes from '../../packages/compiler/src/index.ts'
// The binding's source is CJS-style (uses `require()` for the native node
// addon) and the bench package is `"type": "module"`. tsx wraps the CJS
// module under `default`, so destructure from there.
const { createCompiler } = bindingDefault as unknown as typeof bindingTypes

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)

interface Args {
  cwd: string
  synth: number | null
  warm: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = { cwd: 'sandbox/vite-ts', synth: null, warm: 50 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--cwd' && argv[i + 1]) args.cwd = argv[++i]
    else if (arg === '--synth' && argv[i + 1]) args.synth = Number(argv[++i])
    else if (arg === '--warm' && argv[i + 1]) args.warm = Number(argv[++i])
  }
  if (!Number.isFinite(args.warm) || args.warm < 0) {
    throw new Error(`Invalid --warm value: ${args.warm}`)
  }
  if (args.synth !== null && (!Number.isFinite(args.synth) || args.synth < 1)) {
    throw new Error(`Invalid --synth value: ${args.synth}`)
  }
  return args
}

function ms(value: number): number {
  return Number(value.toFixed(3))
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return 'n/a'
  return `${(numerator / denominator).toFixed(2)}×`
}

/// Config for the Rust compiler, with an import map broad enough to match
/// every sandbox project that uses Panda's default codegen layout. `modules`
/// are substring-matched so `'styled-system/css'` catches `../styled-system/css`,
/// `~/styled-system/css`, etc. `createCompiler` derives the matchers + token
/// dictionary from this config (one-time setup cost).
const rustConfig = {
  cwd: repoRoot,
  outdir: 'styled-system',
  importMap: {
    css: ['styled-system/css'],
    recipe: ['styled-system/recipes'],
    pattern: ['styled-system/patterns'],
    jsx: ['styled-system/jsx'],
    tokens: ['styled-system/tokens'],
  },
  jsxFactory: 'styled',
}

interface Source {
  path: string
  source: string
  bytes: number
}

/// Generate a realistic Panda-using file. The shape mirrors what users
/// actually write: a mix of `css({...})` calls, `<styled.div ... />` JSX,
/// recipe references, and pattern calls. Variation across files prevents
/// any extractor shortcut from getting unrealistic cache hits.
function synthSource(index: number): string {
  const colors = ['red', 'blue', 'green', 'amber', 'slate', 'fuchsia']
  const c1 = colors[index % colors.length]
  const c2 = colors[(index + 3) % colors.length]
  return `import { useState } from 'react'
import { css, cx, cva } from '../styled-system/css'
import { panda, Stack, HStack } from '../styled-system/jsx'
import { vstack, hstack, circle } from '../styled-system/patterns'
import { button } from '../styled-system/recipes'
import { token } from '../styled-system/tokens'

const heading = cva({
  base: { fontSize: '2xl', fontWeight: 'bold', color: '${c1}.500' },
  variants: {
    size: {
      sm: { fontSize: 'sm' },
      md: { fontSize: 'md', lineHeight: '1.5' },
      lg: { fontSize: 'xl', letterSpacing: 'wide' },
    },
    tone: {
      muted: { color: 'gray.400' },
      vivid: { color: '${c2}.600' },
    },
  },
  defaultVariants: { size: 'md', tone: 'vivid' },
})

const sharedStyles = css({
  display: 'flex',
  gap: token('spacing.4'),
  padding: { base: '4', md: '6', lg: '8' },
  bg: '${c1}.100',
  _hover: { bg: '${c1}.200' },
  _dark: { bg: '${c1}.800', _hover: { bg: '${c1}.700' } },
})

export function Component${index}() {
  const [state, setState] = useState(0)
  return (
    <Stack gap="4" align="center" className={cx(sharedStyles, heading({ size: 'lg' }))}>
      <panda.h1 fontSize="3xl" color="${c2}.700" letterSpacing="tight">
        Heading ${index}
      </panda.h1>
      <HStack gap="2">
        <button className={button({ variant: 'solid' })}>Click {state}</button>
        <button className={button({ variant: 'outline' })}>Reset</button>
      </HStack>
      <div className={vstack({ gap: '6' })}>
        <div className={circle({ size: '12', bg: '${c1}.300' })}>{index}</div>
        <div className={hstack({ gap: '3' })}>
          <span className={css({ color: 'gray.500' })}>Label</span>
          <span className={css({ fontWeight: 'medium' })}>Value</span>
        </div>
      </div>
    </Stack>
  )
}
`
}

async function loadFromCwd(cwd: string): Promise<{
  sources: Source[]
  context: any
  encoder: any
}> {
  console.error(`> loading JS context for ${cwd}…`)
  const context = (await pandaNode.loadConfigAndCreateContext({ cwd })) as any
  console.error(`> globbing files…`)
  const files: string[] = context.getFiles()
  if (files.length === 0) {
    throw new Error(`no files matched in ${cwd}`)
  }
  const sources: Source[] = files.map((path) => ({
    path,
    source: readFileSync(path, 'utf8'),
    bytes: statSync(path).size,
  }))
  return { sources, context, encoder: context.parserOptions.encoder }
}

async function loadSynthetic(n: number): Promise<{
  sources: Source[]
  context: any
  encoder: any
}> {
  console.error(`> loading JS context (using sandbox/vite-ts as a config seed)…`)
  // We still need a JS context so the JS parser has a valid encoder /
  // matchers from a real panda.config.ts. Source files are virtual.
  const seedCwd = resolve(repoRoot, 'sandbox/vite-ts')
  const context = (await pandaNode.loadConfigAndCreateContext({ cwd: seedCwd })) as any

  console.error(`> generating ${n} synthetic files…`)
  const sources: Source[] = []
  for (let i = 0; i < n; i++) {
    // Place synthetic files under the seed cwd so the JS Project's
    // ts-morph instance can resolve them as in-memory files.
    const path = resolve(seedCwd, `src/__synth/Component${i}.tsx`)
    const source = synthSource(i)
    sources.push({ path, source, bytes: Buffer.byteLength(source, 'utf8') })
  }
  // Pre-register each synthetic file in ts-morph so parseSourceFile finds
  // them. (Without this, ts-morph would try to read from disk.)
  for (const { path, source } of sources) {
    context.project.addSourceFile(path, source)
  }
  return { sources, context, encoder: context.parserOptions.encoder }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const {
    sources,
    context,
    encoder: jsEncoder,
  } = args.synth !== null ? await loadSynthetic(args.synth) : await loadFromCwd(resolve(repoRoot, args.cwd))

  const totalBytes = sources.reduce((acc, s) => acc + s.bytes, 0)
  const largest = sources.slice().sort((a, b) => b.bytes - a.bytes)[0]

  const fixtureLabel = args.synth !== null ? `synth-${args.synth}` : args.cwd
  console.error(`> ${sources.length} files, ${(totalBytes / 1024).toFixed(1)} KB total\n`)

  // === setup costs ===

  const jsSetupStart = performance.now()
  void context.project.parseSourceFile(largest.path, jsEncoder)
  const jsSetupMs = performance.now() - jsSetupStart

  const rustSetupStart = performance.now()
  const rustExtractor = createCompiler(rustConfig)
  void rustExtractor.extract(largest.source, largest.path)
  const rustSetupMs = performance.now() - rustSetupStart

  // === cold pass: every file, once each ===

  const freshJsEncoder = context.parserOptions.encoder.clone()
  const jsColdStart = performance.now()
  for (const { path } of sources) {
    context.project.parseSourceFile(path, freshJsEncoder)
  }
  const jsColdMs = performance.now() - jsColdStart

  const freshRustExtractor = createCompiler(rustConfig)
  const rustColdStart = performance.now()
  for (const { source, path } of sources) {
    freshRustExtractor.extract(source, path)
  }
  const rustColdMs = performance.now() - rustColdStart

  // === warm pass: largest file, N iterations ===

  const jsWarmStart = performance.now()
  for (let i = 0; i < args.warm; i++) {
    context.project.parseSourceFile(largest.path, jsEncoder)
  }
  const jsWarmMs = performance.now() - jsWarmStart

  const rustWarmStart = performance.now()
  for (let i = 0; i < args.warm; i++) {
    rustExtractor.extract(largest.source, largest.path)
  }
  const rustWarmMs = performance.now() - rustWarmStart

  // === report ===

  const summary = {
    fixture: fixtureLabel,
    files: sources.length,
    totalBytes,
    largestFile: { path: largest.path.replace(`${repoRoot}/`, ''), bytes: largest.bytes },
    warmIterations: args.warm,
    js: {
      setupMs: ms(jsSetupMs),
      cold: {
        totalMs: ms(jsColdMs),
        perFileMs: ms(jsColdMs / sources.length),
        bytesPerMs: ms(totalBytes / jsColdMs),
      },
      warm: {
        totalMs: ms(jsWarmMs),
        perCallMs: ms(jsWarmMs / args.warm),
      },
    },
    rust: {
      setupMs: ms(rustSetupMs),
      cold: {
        totalMs: ms(rustColdMs),
        perFileMs: ms(rustColdMs / sources.length),
        bytesPerMs: ms(totalBytes / rustColdMs),
      },
      warm: {
        totalMs: ms(rustWarmMs),
        perCallMs: ms(rustWarmMs / args.warm),
      },
    },
    speedup: {
      setup: pct(jsSetupMs, rustSetupMs),
      coldTotal: pct(jsColdMs, rustColdMs),
      coldPerFile: pct(jsColdMs / sources.length, rustColdMs / sources.length),
      warmPerCall: pct(jsWarmMs / args.warm, rustWarmMs / args.warm),
    },
  }

  console.log(JSON.stringify(summary, null, 2))

  console.error(`\nspeedup (rust vs js): cold ${summary.speedup.coldTotal} • warm/file ${summary.speedup.warmPerCall}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
