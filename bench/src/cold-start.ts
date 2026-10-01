import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const bin = join(repoRoot, 'packages/cli/bin.js')
const fixtureRoot = join(repoRoot, 'bench/.cold-start')

interface Case {
  name: string
  presets: string[]
}

const cases: Case[] = [
  { name: 'no presets', presets: [] },
  { name: 'preset-base', presets: ['@pandacss/preset-base'] },
  { name: 'preset-base + preset-panda', presets: ['@pandacss/preset-base', '@pandacss/preset-panda'] },
]

function parseRuns(argv: string[]): number {
  const index = argv.indexOf('--runs')
  const runs = index === -1 ? 10 : Number(argv[index + 1])
  if (!Number.isInteger(runs) || runs < 1) throw new Error(`Invalid --runs: ${argv[index + 1]}`)
  return runs
}

function writeFixture(testCase: Case): string {
  const dir = join(fixtureRoot, testCase.name.replace(/\W+/g, '-'))
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'node_modules/@pandacss'), { recursive: true })
  symlinkSync(join(repoRoot, 'packages/dev'), join(dir, 'node_modules/@pandacss/dev'))
  for (const name of ['preset-base', 'preset-panda']) {
    const target = join(dir, 'node_modules/@pandacss', name)
    cpSync(join(repoRoot, 'packages', name, 'package.json'), join(target, 'package.json'))
    cpSync(join(repoRoot, 'packages', name, 'dist'), join(target, 'dist'), { recursive: true })
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'cold-start', private: true, type: 'module' }))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ${JSON.stringify(testCase.presets)},
  include: ['./src/**/*.ts'],
  outdir: 'styled-system',
})
`,
  )
  writeFileSync(
    join(dir, 'src/app.ts'),
    `import { css } from '../styled-system/css'
export const box = css({ color: 'red', padding: '4px', _hover: { color: 'blue' } })
`,
  )
  return dir
}

function time(command: string[], cwd: string): number {
  const start = performance.now()
  const result = spawnSync(process.execPath, command, { cwd, encoding: 'utf8' })
  const elapsed = performance.now() - start
  if (result.status !== 0) throw new Error(`${command.join(' ')} failed:\n${result.stderr}`)
  return elapsed
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

function main() {
  const runs = parseRuns(process.argv.slice(2))
  const rows = cases.map((testCase) => {
    const dir = writeFixture(testCase)
    const node: number[] = []
    const panda: number[] = []

    time([bin], dir)
    for (let i = 0; i < runs; i++) {
      node.push(time(['-e', '0'], dir))
      panda.push(time([bin], dir))
    }

    return {
      case: testCase.name,
      'node startup (ms)': median(node).toFixed(0),
      'panda (ms)': median(panda).toFixed(0),
    }
  })

  rmSync(fixtureRoot, { recursive: true, force: true })
  console.log(`Cold start of \`panda\` (median of ${runs} runs, each a fresh process)`)
  console.table(rows)
}

main()
