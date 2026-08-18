/**
 * CI benchmark: measures the current build of the Rust engine on a fixed
 * synthetic corpus and writes a JSON result. The `benchmarks` workflow runs
 * this on the PR base and head, then `ci-compare` diffs the two.
 *
 * Deliberately dependency-light: it builds a small inline config through
 * `createCompiler` (no presets), so the same script runs on any checkout that
 * has `@pandacss/compiler` built. Measures the engine, not preset richness.
 *
 *   pnpm --filter=./bench ci -- --out result.json --files 100 --runs 7
 */
import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { createCompiler } from '@pandacss/compiler'

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

const importMap = {
  css: ['@panda/css'],
  recipe: ['@panda/recipes'],
  pattern: ['@panda/patterns'],
  jsx: ['@panda/jsx'],
  tokens: ['@panda/tokens'],
}

function config() {
  return { cwd: '/virtual', outdir: 'styled-system', importMap, jsxFactory: 'styled', jsxFramework: 'react' }
}

const LAYERS = ['reset', 'base', 'tokens', 'recipes', 'utilities']

// Each file emits three components that exercise different paths: a `css` card
// (static styles, four conditions, a responsive media query, a nested
// selector), a `cva` button (two variant axes plus compound variants), and an
// `sva` menu (a slot recipe with a size variant). Raw CSS properties so no
// preset utilities are needed. Content varies by index so classes don't all
// collapse to the same atoms.
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

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const files = Array.from({ length: args.files }, (_, i) => genFile(i))

  const setup: number[] = []
  const coldParse: number[] = []
  const emit: number[] = []
  let css = ''

  for (let r = 0; r < args.runs; r++) {
    const t0 = performance.now()
    const compiler = createCompiler(config(), { crossFile: false })
    setup.push(performance.now() - t0)

    const t1 = performance.now()
    for (const f of files) compiler.parseFileSource(f.path, f.source)
    coldParse.push(performance.now() - t1)

    const t2 = performance.now()
    css = compiler.getLayerCss({ layers: LAYERS }).css
    emit.push(performance.now() - t2)
  }

  const cssBytes = Buffer.byteLength(css, 'utf8')
  const cssGzipBytes = gzipSync(css).length

  const result = {
    meta: { files: args.files, runs: args.runs, node: process.version },
    perf: {
      'setup.ms': round(median(setup)),
      'parse.cold.ms': round(median(coldParse)),
      'emit.ms': round(median(emit)),
    },
    size: {
      'css.bytes': cssBytes,
      'css.gzip.bytes': cssGzipBytes,
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
