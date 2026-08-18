import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { createCompiler } from '@pandacss/compiler'

const importMap = {
  css: ['@panda/css'],
  recipe: ['@panda/recipes'],
  pattern: ['@panda/patterns'],
  jsx: ['@panda/jsx'],
  tokens: ['@panda/tokens'],
}

const LAYERS = ['reset', 'base', 'tokens', 'recipes', 'utilities']

function timed<T>(fn: () => T): [ms: number, value: T] {
  const start = performance.now()
  const value = fn()
  return [performance.now() - start, value]
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const round = (n: number): number => Math.round(n * 1000) / 1000
const bytes = (s: string): number => Buffer.byteLength(s, 'utf8')
const gzip = (s: string): number => gzipSync(s).length

function extractionConfig() {
  return { cwd: '/virtual', outdir: 'styled-system', importMap, jsxFactory: 'styled', jsxFramework: 'react' }
}

function genFile(i: number): { path: string; source: string } {
  const hue = i % 360
  const gap = (i % 8) + 2
  return {
    path: `/virtual/comp-${i}.tsx`,
    source: `import { css, cva, sva } from '@panda/css'

export const card${i} = css({
  display: 'flex',
  alignItems: 'center',
  gap: '${gap}px',
  padding: '16px',
  color: 'hsl(${hue} 40% 20%)',
  backgroundColor: 'hsl(${hue} 40% 96%)',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  _hover: { backgroundColor: 'hsl(${hue} 40% 92%)' },
  _focus: { outline: '2px solid hsl(${hue} 60% 45%)' },
  _active: { transform: 'scale(0.99)' },
  _dark: { color: 'hsl(${hue} 40% 92%)', backgroundColor: 'hsl(${hue} 30% 12%)' },
  '& svg': { width: '${gap + 8}px', height: '${gap + 8}px' },
  '@media (min-width: 768px)': { padding: '24px', fontSize: '16px' },
})

export const button${i} = cva({
  base: { display: 'inline-flex', alignItems: 'center', borderRadius: '6px', fontWeight: 600 },
  variants: {
    size: {
      sm: { padding: '4px 8px', fontSize: '12px' },
      md: { padding: '8px 16px', fontSize: '14px' },
      lg: { padding: '12px 24px', fontSize: '16px' },
    },
    tone: {
      solid: { color: '#fff', backgroundColor: 'hsl(${hue} 60% 45%)' },
      ghost: { color: 'hsl(${hue} 60% 45%)', backgroundColor: 'transparent' },
      outline: { color: 'hsl(${hue} 60% 45%)', border: '1px solid hsl(${hue} 60% 45%)' },
    },
  },
  compoundVariants: [
    { size: 'lg', tone: 'solid', css: { boxShadow: '0 1px 2px hsl(${hue} 60% 30%)' } },
    { size: 'sm', tone: 'ghost', css: { opacity: 0.9 } },
  ],
  defaultVariants: { size: 'md', tone: 'solid' },
})

export const menu${i} = sva({
  slots: ['root', 'item', 'label'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '${gap}px', padding: '8px' },
    item: { display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '4px', _hover: { backgroundColor: 'hsl(${hue} 40% 94%)' } },
    label: { fontSize: '12px', color: 'hsl(${hue} 20% 40%)' },
  },
  variants: {
    size: {
      sm: { item: { padding: '4px', fontSize: '12px' }, label: { fontSize: '10px' } },
      lg: { item: { padding: '10px', fontSize: '16px' }, label: { fontSize: '14px' } },
    },
  },
  defaultVariants: { size: 'sm' },
})
`,
  }
}

const SPACING_VALUES = 133
const SPACING_PROPERTIES = [
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingX',
  'paddingY',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginX',
  'marginY',
]
const CONTAINERS = 14

function staticCssConfig() {
  const spacingKeys = Array.from({ length: SPACING_VALUES }, (_, i) => String(i))
  const spacing = Object.fromEntries(spacingKeys.map((key, i) => [key, { value: `${i * 0.25}em` }]))
  const names = ['sm', 'md', 'lg', 'xl']
  const containers = Object.fromEntries(
    Array.from({ length: CONTAINERS }, (_, i) => [names[i] ?? `c${i}`, `${20 + i * 4}rem`]),
  )
  const properties = Object.fromEntries(SPACING_PROPERTIES.map((p) => [p, spacingKeys]))
  return {
    cwd: '/virtual',
    outdir: 'styled-system',
    importMap,
    preflight: false,
    theme: { containerNames: ['pb'], containers, tokens: { spacing, sizes: spacing } },
    staticCss: { css: [{ responsive: false, conditions: ['@pb/sm', '@pb/md', '@pb/lg', '@pb/xl'], properties }] },
  }
}

function benchExtraction(files: ReturnType<typeof genFile>[], runs: number) {
  const setup: number[] = []
  const parse: number[] = []
  const emit: number[] = []
  let css = ''

  for (let r = 0; r < runs; r++) {
    const [setupMs, compiler] = timed(() => createCompiler(extractionConfig(), { crossFile: false }))
    const [parseMs] = timed(() => {
      for (const file of files) compiler.parseFileSource(file.path, file.source)
    })
    const [emitMs, out] = timed(() => compiler.getLayerCss({ layers: LAYERS }).css)
    setup.push(setupMs)
    parse.push(parseMs)
    emit.push(emitMs)
    css = out
  }

  return {
    perf: {
      'setup.ms': round(median(setup)),
      'parse.cold.ms': round(median(parse)),
      'emit.ms': round(median(emit)),
    },
    size: {
      'css.bytes': bytes(css),
      'css.gzip.bytes': gzip(css),
    },
  }
}

function benchStaticCss(runs: number) {
  const config = staticCssConfig()
  const emit: number[] = []
  let css = ''

  for (let r = 0; r < runs; r++) {
    const compiler = createCompiler(config, { crossFile: false })
    compiler.parseFileSource('/virtual/static.tsx', 'export const x = 1\n')
    const [emitMs, out] = timed(() => compiler.getLayerCss({ layers: LAYERS }).css)
    emit.push(emitMs)
    css = out
  }

  return {
    emitMs: round(median(emit)),
    cssBytes: bytes(css),
    gzipBytes: gzip(css),
    containerBlocks: (css.match(/@container/g) ?? []).length,
  }
}

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
