import { readFileSync } from 'node:fs'

interface Result {
  meta?: Record<string, unknown>
  perf?: Record<string, number>
  size?: Record<string, number>
  static?: Record<string, number>
}

function read(path: string): Result {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Result
  } catch {
    return {}
  }
}

const PERCENT = 100
const PCT_DECIMALS = 1
const NOISE_PCT = 2
const FMT_DECIMALS = 3

function fmt(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(FMT_DECIMALS)
}

function change(base: number | undefined, head: number): string {
  if (base === undefined || base === 0) return '🆕 new'
  const pct = ((head - base) / base) * PERCENT
  if (Math.abs(pct) < NOISE_PCT) return `⚪ ${pct >= 0 ? '+' : ''}${pct.toFixed(PCT_DECIMALS)}%`
  const sign = pct > 0 ? '+' : ''
  return `${pct < 0 ? '🟢' : '🔴'} ${sign}${pct.toFixed(PCT_DECIMALS)}%`
}

function main() {
  const [basePath, headPath] = process.argv.slice(2).filter((a) => a !== '--')
  if (!basePath || !headPath) throw new Error('usage: ci-compare <base.json> <head.json>')

  const base = read(basePath)
  const head = read(headPath)

  const rows: string[] = []
  for (const group of ['perf', 'size', 'static'] as const) {
    const headGroup = head[group]
    if (!headGroup) continue
    const baseGroup = base[group] ?? {}
    for (const key of Object.keys(headGroup)) {
      rows.push(
        `| \`${key}\` | ${key in baseGroup ? fmt(baseGroup[key]) : '—'} | ${fmt(headGroup[key])} | ${change(baseGroup[key], headGroup[key])} |`,
      )
    }
  }

  if (rows.length === 0) {
    console.log('_No benchmark results to compare._')
    return
  }

  const files = (head.meta?.files as number) ?? '?'
  const runs = (head.meta?.runs as number) ?? '?'
  const blocks = head.meta?.['staticcss.container.blocks'] as number | undefined
  console.log(`Corpus: ${files} files, median of ${runs} runs. Lower is better.\n`)
  console.log('| Metric | Base | Head | Change |')
  console.log('| --- | ---: | ---: | ---: |')
  console.log(rows.join('\n'))
  if (blocks !== undefined) {
    console.log(`\n_\`staticcss.*\` is a large staticCss build: a spacing scale over ${blocks} \`@container\` blocks._`)
  }
}

main()
