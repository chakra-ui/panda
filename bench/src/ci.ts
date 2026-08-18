import { writeFileSync } from 'node:fs'
import { CONTAINERS } from './ci/constants'
import { genFile } from './ci/corpus'
import { benchExtraction, benchStaticCss } from './ci/benchmarks'

interface Args {
  out: string | null
  files: number
  runs: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = { out: null, files: 100, runs: 7 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--out' && argv[i + 1]) args.out = argv[++i]
    else if (arg === '--files' && argv[i + 1]) args.files = Number(argv[++i])
    else if (arg === '--runs' && argv[i + 1]) args.runs = Number(argv[++i])
  }
  if (!Number.isFinite(args.files) || args.files < 1) throw new Error(`Invalid --files: ${args.files}`)
  if (!Number.isFinite(args.runs) || args.runs < 1) throw new Error(`Invalid --runs: ${args.runs}`)
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const files = Array.from({ length: args.files }, (_, i) => genFile(i))

  const extraction = benchExtraction(files, args.runs)
  const staticCss = benchStaticCss(args.runs)

  const result = {
    meta: {
      files: args.files,
      runs: args.runs,
      node: process.version,
      'staticcss.containers': CONTAINERS,
      'staticcss.container.blocks': staticCss.containerBlocks,
    },
    perf: extraction.perf,
    size: extraction.size,
    static: {
      'staticcss.emit.ms': staticCss.emitMs,
      'staticcss.css.bytes': staticCss.cssBytes,
      'staticcss.gzip.bytes': staticCss.gzipBytes,
    },
  }

  const json = JSON.stringify(result, null, 2)
  if (args.out) {
    writeFileSync(args.out, json)
    console.error(`> wrote ${args.out} (${args.files} files, ${args.runs} runs)`)
  } else {
    console.log(json)
  }
}

main()
