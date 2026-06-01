/**
 * Type-performance harness for the generated type artifacts.
 *
 * For every fixture in `fixtures/generated-types/configs/*.json`:
 *   1. Generates the Rust-codegen styled-system (via the `generated_types_perf`
 *      cargo bin) into `out/<name>/rust/`.
 *   2. Generates the legacy v1 styled-system (via `@pandacss/node`) into
 *      `out/<name>/legacy/`.
 *   3. Drops an identical `usage.ts` + `tsconfig.json` into both and runs
 *      `tsc --extendedDiagnostics` on each.
 *   4. Prints a Rust-vs-legacy delta table (Types, Instantiations, Memory, Check time).
 *
 * The usage file imports only the type surface (`./styled-system/types`), so we
 * measure the generated type graph — not WIP runtime helpers.
 *
 * Run: `pnpm bench:types`
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import pandaNode from '../../packages/node/src/index'

const { codegen, loadConfigAndCreateContext } = pandaNode

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..', '..')
const fixturesDir = join(repoRoot, 'fixtures', 'generated-types')
const configsDir = join(fixturesDir, 'configs')
const outDir = join(fixturesDir, 'out')
const tsc = join(repoRoot, 'node_modules', '.bin', 'tsc')

// Universal + strict-safe: only token-backed values, conditions, nesting, and an
// arbitrary selector. `SystemStyleObject` is the recursive workhorse and is the
// one public type both the Rust and legacy graphs export under the same name, so
// the comparison stays apples-to-apples.
const USAGE = `import type { SystemStyleObject } from './styled-system/types'

const a: SystemStyleObject = {
  color: 'red.500',
  padding: '4',
  _hover: { color: 'red.100', padding: '8' },
  md: { color: 'red.900', _hover: { padding: '2' } },
  '& span': { color: 'red.500', md: { padding: '4' } },
}
const nested: SystemStyleObject = { _hover: { md: { '& svg': { color: 'red.900' } } } }
void a; void nested
`

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      moduleResolution: 'bundler',
      module: 'esnext',
      target: 'esnext',
    },
    include: ['usage.ts'],
  },
  null,
  2,
)

interface Metrics {
  files: number
  types: number
  instantiations: number
  memoryK: number
  checkMs: number
  errors: number
}

function generateRust(): void {
  console.log('› generating Rust codegen fixtures…')
  execFileSync('cargo', ['run', '-q', '-p', 'pandacss_bench', '--bin', 'generated_types_perf'], {
    cwd: repoRoot,
    stdio: 'inherit',
  })
}

async function generateLegacy(name: string, config: Record<string, unknown>): Promise<void> {
  const legacyDir = join(outDir, name, 'legacy')
  rmSync(join(legacyDir, 'styled-system'), { recursive: true, force: true })
  mkdirSync(legacyDir, { recursive: true })

  // eject drops the default base preset so the legacy utility/token surface
  // matches the fixture (and the Rust side, which applies no presets).
  const cfg = { ...config, eject: true, outdir: 'styled-system' }
  writeFileSync(join(legacyDir, 'panda.config.mjs'), `export default ${JSON.stringify(cfg, null, 2)}\n`)

  const ctx = await loadConfigAndCreateContext({ cwd: legacyDir })
  await codegen(ctx as any)
}

function writeUsage(dir: string): void {
  writeFileSync(join(dir, 'usage.ts'), USAGE)
  writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG)
}

function measure(dir: string): Metrics {
  let out = ''
  try {
    out = execFileSync(tsc, ['-p', join(dir, 'tsconfig.json'), '--extendedDiagnostics'], {
      cwd: dir,
      encoding: 'utf8',
    })
  } catch (error: any) {
    // tsc exits non-zero when the fixture has type errors; diagnostics still print.
    out = `${error.stdout ?? ''}${error.stderr ?? ''}`
  }
  const num = (label: string) => {
    const match = out.match(new RegExp(`${label}:\\s+([0-9.]+)`))
    return match ? Number(match[1]) : NaN
  }
  return {
    files: num('Files'),
    types: num('Types'),
    instantiations: num('Instantiations'),
    memoryK: num('Memory used'),
    checkMs: Math.round(num('Check time') * 1000),
    errors: (out.match(/error TS/g) ?? []).length,
  }
}

function pct(rust: number, legacy: number): string {
  if (!Number.isFinite(rust) || !Number.isFinite(legacy) || legacy === 0) return '—'
  const delta = Math.round(((rust - legacy) / legacy) * 100)
  return `${delta > 0 ? '+' : ''}${delta}%`
}

async function main() {
  generateRust()

  const fixtures = readdirSync(configsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort()

  const rows: Array<{ fixture: string; metric: string; rust: number; legacy: number; delta: string }> = []

  for (const name of fixtures) {
    const config = JSON.parse(readFileSync(join(configsDir, `${name}.json`), 'utf8'))
    console.log(`› ${name}: legacy codegen…`)
    try {
      await generateLegacy(name, config)
    } catch (error) {
      console.warn(`  ⚠ legacy codegen failed for ${name}: ${(error as Error).message.split('\n')[0]}`)
    }

    const rustDir = join(outDir, name, 'rust')
    const legacyDir = join(outDir, name, 'legacy')
    if (!existsSync(join(rustDir, 'styled-system'))) {
      console.warn(`  ⚠ no rust output for ${name}, skipping`)
      continue
    }
    const hasLegacy = existsSync(join(legacyDir, 'styled-system'))
    writeUsage(rustDir)
    if (hasLegacy) writeUsage(legacyDir)

    const rust = measure(rustDir)
    const legacy = hasLegacy
      ? measure(legacyDir)
      : { types: NaN, instantiations: NaN, memoryK: NaN, checkMs: NaN, files: NaN, errors: 0 }

    for (const [metric, key] of [
      ['Types', 'types'],
      ['Instantiations', 'instantiations'],
      ['Memory (K)', 'memoryK'],
      ['Check (ms)', 'checkMs'],
    ] as const) {
      rows.push({
        fixture: name,
        metric,
        rust: rust[key],
        legacy: legacy[key],
        delta: pct(rust[key], legacy[key]),
      })
    }
    if (rust.errors || legacy.errors) {
      console.log(`  (type errors — rust: ${rust.errors}, legacy: ${legacy.errors})`)
    }
  }

  console.log(
    `\n${'fixture'.padEnd(14)}${'metric'.padEnd(16)}${'rust'.padStart(12)}${'legacy'.padStart(12)}${'Δ vs legacy'.padStart(14)}`,
  )
  console.log('─'.repeat(68))
  for (const r of rows) {
    const rust = Number.isFinite(r.rust) ? String(r.rust) : '—'
    const legacy = Number.isFinite(r.legacy) ? String(r.legacy) : '—'
    console.log(
      `${r.fixture.padEnd(14)}${r.metric.padEnd(16)}${rust.padStart(12)}${legacy.padStart(12)}${r.delta.padStart(14)}`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
