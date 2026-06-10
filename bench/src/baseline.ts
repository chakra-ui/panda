import { performance } from 'node:perf_hooks'
import { resolve } from 'node:path'
import * as pandaNode from '@pandacss/node'

type Args = {
  cwd: string
  warm: number
}

type MemorySample = {
  rss: number
  heapUsed: number
}

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const { loadConfigAndCreateContext } = pandaNode

function parseArgs(argv: string[]): Args {
  const args: Args = {
    cwd: 'sandbox/vite-ts',
    warm: 3,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--cwd' && argv[i + 1]) {
      args.cwd = argv[++i]
    } else if (arg === '--warm' && argv[i + 1]) {
      args.warm = Number(argv[++i])
    }
  }

  if (!Number.isFinite(args.warm) || args.warm < 0) {
    throw new Error(`Invalid --warm value: ${args.warm}`)
  }

  return args
}

function memory(): MemorySample {
  const { rss, heapUsed } = process.memoryUsage()
  return { rss, heapUsed }
}

function mb(value: number) {
  return Number((value / 1024 / 1024).toFixed(2))
}

async function measure<T>(label: string, fn: () => T | Promise<T>) {
  const beforeMem = memory()
  const start = performance.now()
  const result = await fn()
  const durationMs = performance.now() - start
  const afterMem = memory()

  return {
    label,
    durationMs: Number(durationMs.toFixed(2)),
    memory: {
      before: { rss: mb(beforeMem.rss), heapUsed: mb(beforeMem.heapUsed) },
      after: { rss: mb(afterMem.rss), heapUsed: mb(afterMem.heapUsed) },
      delta: { rss: mb(afterMem.rss - beforeMem.rss), heapUsed: mb(afterMem.heapUsed - beforeMem.heapUsed) },
    },
    result,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const cwd = resolve(repoRoot, args.cwd)

  const context = await measure('context:create', () => loadConfigAndCreateContext({ cwd }))

  const coldParse = await measure('parse:cold', () => context.result.parseFiles())

  const css = await measure('css:generate', () => {
    const sheet = context.result.createSheet()
    context.result.appendBaselineCss(sheet)
    context.result.appendParserCss(sheet)
    return context.result.getCss(sheet).length
  })

  const filesWithCss = coldParse.result.filesWithCss
  const warmFile = filesWithCss[0]
  const warmRuns = [] as Array<{ durationMs: number; file: string | undefined }>

  if (warmFile) {
    for (let i = 0; i < args.warm; i++) {
      const warm = await measure(`parse:warm:${i + 1}`, () => context.result.parseFile(warmFile))
      warmRuns.push({ durationMs: warm.durationMs, file: warmFile })
    }
  }

  const summary = {
    cwd,
    engine: 'ts-morph',
    files: coldParse.result.files.length,
    filesWithCss: coldParse.result.filesWithCss.length,
    timings: {
      contextCreateMs: context.durationMs,
      coldParseMs: coldParse.durationMs,
      cssGenerateMs: css.durationMs,
      warmParseMs: warmRuns,
    },
    output: {
      cssBytes: css.result,
    },
    memory: {
      contextCreate: context.memory,
      coldParse: coldParse.memory,
      cssGenerate: css.memory,
    },
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
