import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { createNodeDriver } from '@pandacss/compiler'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = join(repoRoot, 'bench', '.recipe-runtime-out')
const configPath = join(outDir, 'panda.config.mjs')
const pandaBin = join(repoRoot, 'packages', 'dev', 'bin.js')
// Load the transformer and rolldown from the transformer package's own install to keep bench off the lockfile.
const transformerDir = join(repoRoot, 'packages', 'transformer')
const requireFromTransformer = createRequire(join(transformerDir, 'package.json'))

type Props = Record<string, unknown>
type Config = Record<string, any>
type Recipe = (props?: Props) => unknown

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const size = {
  sm: { height: '32px', paddingInline: '12px', fontSize: '14px' },
  md: { height: '40px', paddingInline: '16px', fontSize: '16px' },
  lg: { height: '48px', paddingInline: '24px', fontSize: '18px' },
}
const variant = {
  solid: { background: '#2563eb', color: 'white' },
  outline: { borderWidth: '1px', borderColor: '#2563eb', color: '#2563eb' },
  ghost: { background: 'transparent', color: '#2563eb' },
}
const button: Config = {
  base: { display: 'inline-flex', alignItems: 'center', fontWeight: '500', borderRadius: '6px' },
  variants: { size, variant },
  defaultVariants: { size: 'md', variant: 'solid' },
}
const toggles: Config = {
  base: { display: 'block' },
  variants: {
    disabled: { true: { opacity: '0.5' } },
    block: { true: { width: '100%' } },
    loading: { true: { cursor: 'wait' } },
    active: { true: { outline: '2px solid #2563eb' } },
  },
}
const compound: Config = {
  ...button,
  compoundVariants: [
    { size: 'sm', variant: 'outline', css: { borderWidth: '2px' } },
    { size: ['md', 'lg'], variant: 'ghost', css: { textDecoration: 'underline' } },
    { size: 'lg', variant: 'solid', css: { fontWeight: '700' } },
  ],
}
const WIDE_PROPERTIES = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingBottom']
const wide: Config = {
  variants: Object.fromEntries(
    WIDE_PROPERTIES.map((property, g) => [
      `g${g}`,
      Object.fromEntries(Array.from({ length: 5 }, (_, o) => [`o${o}`, { [property]: `${o * 4}px` }])),
    ]),
  ),
}
const tabs: Config = {
  slots: ['root', 'list', 'trigger'],
  base: { root: { display: 'flex' }, list: { gap: '4px' }, trigger: { padding: '8px' } },
  variants: {
    size: { sm: { trigger: { fontSize: '12px' } }, md: { trigger: { fontSize: '14px' } } },
    variant: {
      line: { list: { borderBottom: '1px solid #e5e7eb' } },
      enclosed: { list: { background: '#f3f4f6' }, trigger: { borderRadius: '4px' } },
    },
  },
  compoundVariants: [{ size: 'sm', variant: 'enclosed', css: { trigger: { padding: '4px' } } }],
  defaultVariants: { size: 'md', variant: 'line' },
}

/** Explicit utilities for every fixture property, so the transform can encode them without presets. */
const UTILITIES = Object.fromEntries(
  [
    ['display', 'd'],
    ['alignItems', 'ai'],
    ['fontWeight', 'fw'],
    ['borderRadius', 'bdr'],
    ['height', 'h'],
    ['paddingInline', 'px'],
    ['fontSize', 'fs'],
    ['background', 'bg'],
    ['color', 'c'],
    ['borderWidth', 'bdw'],
    ['borderColor', 'bdc'],
    ['opacity', 'op'],
    ['width', 'w'],
    ['cursor', 'cur'],
    ['outline', 'ring'],
    ['textDecoration', 'td'],
    ['gap', 'gap'],
    ['borderBottom', 'bdb'],
    ['padding', 'p'],
    ...WIDE_PROPERTIES.map((property) => [property, property]),
  ].map(([property, className]) => [property, { className }]),
)

let seed = 42
const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]
const randomProps = (config: Config, count: number) =>
  Array.from({ length: count }, () => {
    const props: Props = {}
    for (const key in config.variants) {
      const options: unknown[] = [...Object.keys(config.variants[key]), undefined]
      const value = pick(options)
      if (value !== undefined) props[key] = value === 'true' ? true : value
    }
    return props
  })

interface Workload {
  name: string
  factory: 'cva' | 'sva'
  config: Config
  props: Props[]
}

const WORKLOADS: Workload[] = [
  {
    name: 'button · 4 repeated tuples',
    factory: 'cva',
    config: button,
    props: [{ size: 'sm', variant: 'solid' }, { size: 'md', variant: 'outline' }, {}, { size: 'lg', variant: 'ghost' }],
  },
  { name: 'button · varied tuples', factory: 'cva', config: button, props: randomProps(button, 1024) },
  { name: 'boolean-only · 4 toggles', factory: 'cva', config: toggles, props: randomProps(toggles, 1024) },
  { name: 'compound variants', factory: 'cva', config: compound, props: randomProps(compound, 1024) },
  { name: 'wide · 15,625 combos', factory: 'cva', config: wide, props: randomProps(wide, 20000) },
  { name: 'sva tabs · 3 slots', factory: 'sva', config: tabs, props: randomProps(tabs, 1024) },
]

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function codegen() {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    configPath,
    `import { defineConfig } from '@pandacss/dev'
export default defineConfig({
  preflight: false,
  jsxFramework: 'react',
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  utilities: ${JSON.stringify(UTILITIES)},
})
`,
  )
  mkdirSync(join(outDir, 'src'), { recursive: true })
  writeFileSync(join(outDir, 'src', 'app.tsx'), 'export const noop = true\n')
  execFileSync('node', [pandaBin, 'codegen', '--cwd', outDir, '--config', configPath], { stdio: 'ignore' })
}

const fromOut = (file: string) => pathToFileURL(join(outDir, file)).href

/** Point transformed imports at files on disk so node can load them directly. */
function localizeImports(code: string) {
  return code
    .replaceAll("'@pandacss-internal/css'", "'./internal-css.mjs'")
    .replace(/'styled-system\/(\w+)'/g, "'./styled-system/$1/index.js'")
}

let moduleId = 0
function writeModule(code: string) {
  const file = `module-${moduleId++}.mjs`
  writeFileSync(join(outDir, file), code)
  return file
}

async function load(code: string) {
  return import(fromOut(writeModule(code)))
}

/** The pre-specialization `__pcva` input: every style object pre-encoded to its class string. */
function toStringConfig(css: (style: unknown) => string, workload: Workload): Config {
  const { factory, config } = workload
  const mapValues = <T, U>(obj: Record<string, T>, fn: (value: T) => U) =>
    Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]))
  if (factory === 'cva') {
    const cls = (style: unknown) => (style ? css(style) : '')
    return {
      base: cls(config.base),
      variants: mapValues(config.variants ?? {}, (group: Config) => mapValues(group, cls)),
      defaultVariants: config.defaultVariants,
      compoundVariants: (config.compoundVariants ?? []).map(({ css: style, ...conditions }: Config) => ({
        ...conditions,
        className: cls(style),
      })),
    }
  }
  const perSlot = (styles: Config | undefined) =>
    Object.fromEntries(
      config.slots.filter((slot: string) => styles?.[slot]).map((slot: string) => [slot, css(styles![slot])]),
    )
  return {
    slots: config.slots,
    base: perSlot(config.base),
    variants: mapValues(config.variants ?? {}, (group: Config) => mapValues(group, perSlot)),
    defaultVariants: config.defaultVariants,
    compoundVariants: (config.compoundVariants ?? []).map(({ css: style, ...conditions }: Config) => ({
      ...conditions,
      css: perSlot(style),
    })),
  }
}

const recipeSource = (workload: Workload, name: string) =>
  `export const ${name} = ${workload.factory}(${JSON.stringify(workload.config)})`

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

const CALLS = Number(process.env.CALLS ?? 200_000)

function nsPerCall(fn: Recipe, props: Props[], calls = CALLS) {
  let sink: unknown
  const run = () => {
    for (let i = 0; i < calls; i++) sink = fn(props[i % props.length])
  }
  for (let i = 0; i < 3; i++) run()
  const samples: number[] = []
  for (let i = 0; i < 15; i++) {
    const start = performance.now()
    run()
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  void sink
  return (samples[Math.floor(samples.length / 2)] * 1e6) / calls
}

const sortClasses = (value: unknown): unknown =>
  typeof value === 'string'
    ? value.split(' ').filter(Boolean).sort().join(' ')
    : Object.fromEntries(Object.entries(value as Props).map(([slot, cls]) => [slot, sortClasses(cls)]))

function sameOutput(a: Recipe, b: Recipe, props: Props[]) {
  return props.slice(0, 200).every((p) => JSON.stringify(sortClasses(a(p))) === JSON.stringify(sortClasses(b(p))))
}

async function bundleBytes(entryFile: string) {
  const { rolldown } = await import(pathToFileURL(requireFromTransformer.resolve('rolldown')).href)
  const build = await rolldown({ input: join(outDir, entryFile), external: ['react', 'react/jsx-runtime'] })
  try {
    const { output } = await build.generate({ format: 'esm', minify: true })
    const code: string = output[0].code
    return { min: code.length, gzip: gzipSync(code).length }
  } finally {
    await build.close()
  }
}

function table(headers: string[], rows: string[][]) {
  const widths = headers.map((head, i) => Math.max(head.length, ...rows.map((row) => row[i].length)))
  const line = (cells: string[]) =>
    '  ' + cells.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join('  ')
  console.log(line(headers))
  console.log('  ' + widths.map((w) => '─'.repeat(w)).join('  '))
  for (const row of rows) console.log(line(row))
}

const section = (title: string) => console.log(`\n\x1b[1m${title}\x1b[0m\n`)
const ns = (value: number) => `${value.toFixed(0)} ns`
const ratio = (value: number, base: number) => `${(value / base).toFixed(2)}x`
const kb = ({ min, gzip }: { min: number; gzip: number }) => `${min.toLocaleString()} B / ${gzip.toLocaleString()} B`

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Generating styled-system and loading the transformer from the local build…')
  codegen()
  const { createSourceTransformer, getInternalCssRuntimeSource } = await import(
    pathToFileURL(join(transformerDir, 'dist', 'index.js')).href
  )
  writeFileSync(join(outDir, 'internal-css.mjs'), getInternalCssRuntimeSource())
  const driver = await createNodeDriver({ cwd: outDir, configPath })
  const transformer = createSourceTransformer(driver.compiler)
  const transform = (source: string) =>
    localizeImports(transformer.transformSource({ path: 'src/recipes.tsx', source }).code)

  const system = await import(fromOut('styled-system/css/index.js'))
  const internal = await import(fromOut('internal-css.mjs'))
  const jsx = await import(fromOut('styled-system/jsx/index.js'))

  console.log(`node ${process.version} · ${CALLS.toLocaleString()} calls per sample · medians of 15`)

  section('1 · Recipe calls — ns per call (lower is better)')
  const rows: string[][] = []
  for (const workload of WORKLOADS) {
    const sys: Recipe = system[workload.factory](workload.config)
    const legacy: Recipe = internal[workload.factory](toStringConfig(system.css, workload))
    const source = `import { ${workload.factory} } from 'styled-system/css'\n${recipeSource(workload, 'recipe')}`
    const specialized: Recipe = (await load(transform(source))).recipe
    const parity = sameOutput(sys, specialized, workload.props) && sameOutput(sys, legacy, workload.props)

    const sysNs = nsPerCall(sys, workload.props)
    const legacyNs = nsPerCall(legacy, workload.props)
    const specializedNs = nsPerCall(specialized, workload.props)
    rows.push([
      workload.name,
      ns(sysNs),
      ns(legacyNs),
      ns(specializedNs),
      ratio(specializedNs, legacyNs),
      parity ? '✓' : '✗',
    ])
  }
  table(['workload', 'styled-system', 'old __pcva', 'specialized', 'spec/old', 'same classes'], rows)

  section('2 · cx — ns per call against a plain join')
  {
    const plainJoin = (...parts: unknown[]) => parts.filter(Boolean).join(' ')
    const sites = Array.from({ length: 200 }, (_, site) => ({
      base: `d_flex px_${site % 7} c_red.${site % 5}00 bdr_md`,
      overrides: [undefined, undefined, undefined, `px_${site % 3}`, 'mt_2 c_blue', `custom-${site}`],
    }))
    const cases: Array<[string, string[][]]> = [
      [
        'JSX className merges, 200 sites',
        Array.from({ length: 20_000 }, () => {
          const site = pick(sites)
          return [site.base, pick(site.overrides)!]
        }),
      ],
      [
        'recipe fragments, repeated',
        [
          ['d_inline-flex ai_center fw_500 bdr_6px', 'h_32px px_12px fs_14px', 'bg_#2563eb c_white'],
          ['d_inline-flex ai_center fw_500 bdr_6px', 'h_40px px_16px fs_16px', 'bdw_1px bdc_#2563eb c_#2563eb'],
        ],
      ],
      [
        'conflicts, repeated',
        [
          ['px_4 py_2 c_red', 'px_2'],
          ['hover:bg_red d_flex', 'hover:bg_blue'],
        ],
      ],
      [
        'unique className every call',
        Array.from({ length: 20_000 }, (_, i) => ['d_flex px_4 c_red', `custom-${i} mt_${i % 50}px`]),
      ],
      [
        'wide combinations',
        Array.from({ length: 20_000 }, () =>
          WIDE_PROPERTIES.map((property) => `${property}_${Math.floor(random() * 5) * 4}px`).filter(
            () => random() < 0.83,
          ),
        ),
      ],
    ]
    table(
      ['case', 'plain join', 'cx', 'cx/join'],
      cases.map(([name, inputs]) => {
        const join = nsPerCall((args) => plainJoin(...(args as unknown as string[])), inputs as unknown as Props[])
        const merged = nsPerCall((args) => internal.cx(...(args as unknown as string[])), inputs as unknown as Props[])
        return [name, ns(join), ns(merged), ratio(merged, join)]
      }),
    )
  }

  section('3 · Bundle bytes for the six recipes — minified / gzip')
  {
    const exported = WORKLOADS.map((workload, i) => recipeSource(workload, `r${i}`)).join('\n')
    const sysEntry = writeModule(`import { cva, sva } from './styled-system/css/index.js'\n${exported}`)
    const legacyEntry = writeModule(
      `import { cva, sva } from './internal-css.mjs'\n` +
        WORKLOADS.map(
          (workload, i) =>
            `export const r${i} = ${workload.factory}(${JSON.stringify(toStringConfig(system.css, workload))})`,
        ).join('\n'),
    )
    const specializedEntry = writeModule(transform(`import { cva, sva } from 'styled-system/css'\n${exported}`))
    const localEntry = writeModule(
      transform(
        `import { cva, sva } from 'styled-system/css'\n` +
          WORKLOADS.map(
            (workload, i) =>
              `const r${i} = ${workload.factory}(${JSON.stringify(workload.config)})\nexport const use${i} = (p) => r${i}(p)`,
          ).join('\n'),
      ),
    )
    table(
      ['approach', 'min / gzip'],
      [
        ['styled-system cva/sva (incl. css runtime)', kb(await bundleBytes(sysEntry))],
        ['old __pcva string branches', kb(await bundleBytes(legacyEntry))],
        ['specialized, exported (attachRecipe)', kb(await bundleBytes(specializedEntry))],
        ['specialized, call-only locals', kb(await bundleBytes(localEntry))],
      ],
    )
  }

  section('4 · styled() with a cva — µs per server render (lower is better)')
  {
    const RENDERS = Number(process.env.RENDERS ?? 20_000)
    const styledSource = [
      "import { styled } from 'styled-system/jsx'",
      "import { cva } from 'styled-system/css'",
      `const button = cva(${JSON.stringify(button)})`,
      "export const Button = styled('button', button)",
    ].join('\n')
    const plain = (await load(localizeImports(styledSource))).Button
    const transformed = (await load(transform(styledSource))).Button
    const cases: Array<[string, Props[]]> = [
      ['variant props only', WORKLOADS[0].props],
      ['variant + style props', WORKLOADS[0].props.map((p, i) => ({ ...p, marginTop: `${i}px` }))],
    ]
    const perRender = (Component: unknown, props: Props[]) =>
      nsPerCall((p) => renderToStaticMarkup(h(Component as any, p, 'Save')), props, RENDERS) / 1000
    table(
      ['case', 'untransformed', 'transformed', 'transformed/untransformed'],
      cases.map(([name, props]) => {
        const a = perRender(plain, props)
        const b = perRender(transformed, props)
        return [name, `${a.toFixed(2)} µs`, `${b.toFixed(2)} µs`, ratio(b, a)]
      }),
    )
    const plainBytes = await bundleBytes(writeModule(localizeImports(styledSource)))
    const transformedBytes = await bundleBytes(writeModule(transform(styledSource)))
    console.log(
      `\n  bundle: untransformed ${kb(plainBytes)} · transformed ${kb(transformedBytes)} · ` +
        `delta ${(transformedBytes.min - plainBytes.min).toLocaleString()} B / ${(transformedBytes.gzip - plainBytes.gzip).toLocaleString()} B`,
    )
    void jsx
  }
  console.log()
}

main()
