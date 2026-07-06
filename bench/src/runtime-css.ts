import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createElement as h, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = join(repoRoot, 'bench', '.runtime-css-out')
const pandaBin = join(repoRoot, 'packages', 'dev', 'bin.js')

function codegen() {
  mkdirSync(join(outDir, 'src'), { recursive: true })
  writeFileSync(
    join(outDir, 'panda.config.mjs'),
    `import { defineConfig } from '@pandacss/dev'
export default defineConfig({
  preflight: false,
  jsxFramework: 'react',
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
})
`,
  )
  writeFileSync(join(outDir, 'src', 'app.tsx'), `export const noop = true\n`)
  execFileSync('node', [pandaBin, 'codegen', '--cwd', outDir, '--config', join(outDir, 'panda.config.mjs')], {
    stdio: 'ignore',
  })
}

async function loadStyledSystem() {
  const jsx = await import(pathToFileURL(join(outDir, 'styled-system', 'jsx', 'index.js')).href)
  const css = await import(pathToFileURL(join(outDir, 'styled-system', 'css', 'index.js')).href)
  return { styled: jsx.styled, css: css.css, cva: css.cva }
}

interface Result {
  ms: number
  perSec: number
}

function measure(fn: () => unknown, reps: number, warm = 5): Result {
  for (let i = 0; i < warm; i++) fn()
  const samples: number[] = []
  for (let r = 0; r < reps; r++) {
    const t0 = performance.now()
    fn()
    samples.push(performance.now() - t0)
  }
  samples.sort((a, b) => a - b)
  const ms = samples[Math.floor(samples.length / 2)]
  return { ms, perSec: 1000 / ms }
}

function table(headers: string[], rows: string[][]) {
  const widths = headers.map((hd, i) => Math.max(hd.length, ...rows.map((r) => r[i].length)))
  const line = (cells: string[]) =>
    '  ' + cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ')
  console.log(line(headers))
  console.log('  ' + widths.map((w) => '─'.repeat(w)).join('  '))
  for (const r of rows) console.log(line(r))
}

const ms = (r: Result) => `${r.ms.toFixed(2)} ms`
const rps = (r: Result) => `${Math.round(r.perSec).toLocaleString()}/s`
const x = (r: Result, base: Result) => `${(r.ms / base.ms).toFixed(1)}x`
const section = (title: string) => console.log(`\n\x1b[1m${title}\x1b[0m\n`)

function styleFor(p: any, uniq = 0) {
  const { discount, rating, inStock, onSale } = p
  const badgeBg =
    discount >= 50 ? '#dc2626' : discount >= 25 ? '#ea580c' : discount >= 10 ? '#ca8a04' : '#16a34a'
  return {
    article: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      boxShadow: uniq ? `0 1px ${uniq}px rgba(0,0,0,0.06)` : '0 1px 2px rgba(0,0,0,0.06)',
      transitionProperty: 'transform, box-shadow',
      transitionDuration: '150ms',
      _hover: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
      _motionReduce: { transitionDuration: '0ms' },
    },
    media: { position: 'relative', width: '100%', aspectRatio: '1 / 1', backgroundColor: '#f3f4f6', overflow: 'hidden' },
    badge: {
      position: 'absolute',
      top: '8px',
      insetInlineStart: '8px',
      display: onSale ? 'inline-flex' : 'none',
      paddingBlock: '2px',
      paddingInline: '8px',
      borderRadius: '999px',
      fontSize: { base: '11px', md: '12px' },
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: badgeBg,
    },
    body: { display: 'flex', flexDirection: 'column', gap: '6px', padding: { base: '10px', md: '14px' } },
    title: {
      display: '-webkit-box',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: { base: '13px', md: '14px' },
      lineHeight: '18px',
      fontWeight: '500',
      color: '#111827',
    },
    ratingTrack: { position: 'relative', flex: '1', height: '6px', borderRadius: '999px', backgroundColor: '#e5e7eb', overflow: 'hidden' },
    ratingFill: {
      position: 'absolute',
      insetBlock: '0',
      insetInlineStart: '0',
      width: `${(rating / 5) * 100}%`,
      backgroundColor: rating >= 4 ? '#16a34a' : rating >= 2.5 ? '#ca8a04' : '#dc2626',
    },
    priceNow: { fontSize: { base: '15px', md: '16px' }, fontWeight: '700', color: onSale ? '#dc2626' : '#111827' },
    cart: {
      marginTop: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingBlock: '8px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: inStock ? 'pointer' : 'not-allowed',
      color: inStock ? '#ffffff' : '#6b7280',
      backgroundColor: inStock ? '#2563eb' : '#e5e7eb',
      _hover: inStock ? { backgroundColor: '#1d4ed8' } : {},
      _focusVisible: { outline: '2px solid #1d4ed8', outlineOffset: '2px' },
    },
  }
}

const SHAPES = [
  { title: 'Merino wool crew sweater', price: 89.0, discount: 30, rating: 4.6, inStock: true, onSale: true },
  { title: 'Everyday canvas tote', price: 24.5, discount: 0, rating: 3.9, inStock: true, onSale: false },
  { title: 'Trail running shoes', price: 129.99, discount: 15, rating: 4.2, inStock: false, onSale: true },
  { title: 'Ceramic pour-over set', price: 42.0, discount: 55, rating: 2.1, inStock: true, onSale: true },
  { title: 'Linen throw pillow', price: 18.0, discount: 0, rating: 4.9, inStock: true, onSale: false },
]

function page(build: (p: any, i: number) => any, n: number) {
  const kids = []
  for (let i = 0; i < n; i++) kids.push(build(SHAPES[i % SHAPES.length], i))
  return h(Fragment, null, kids)
}
const render = (build: (p: any, i: number) => any, n: number) => () => renderToStaticMarkup(page(build, n))

async function main() {
  const realError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('does not recognize')) return
    realError(...args)
  }

  console.log('Generating styled-system from the local build…')
  codegen()
  const { styled, css, cva } = await loadStyledSystem()

  const StyledTile = (p: any, i: number, uniq = 0) => {
    const s = styleFor(p, uniq)
    return h(
      styled.article,
      { ...s.article, key: i },
      h(styled.div, s.media, h(styled.span, s.badge, `-${p.discount}%`)),
      h(
        styled.div,
        s.body,
        h(styled.h3, s.title, p.title),
        h(styled.div, s.ratingTrack, h(styled.div, s.ratingFill)),
        h(styled.span, s.priceNow, `$${p.price.toFixed(2)}`),
        h(styled.button, { ...s.cart, disabled: !p.inStock }, p.inStock ? 'Add to cart' : 'Out of stock'),
      ),
    )
  }
  const CssTile = (p: any, i: number, uniq = 0) => {
    const s = styleFor(p, uniq)
    return h(
      'article',
      { className: css(s.article), key: i },
      h('div', { className: css(s.media) }, h('span', { className: css(s.badge) }, `-${p.discount}%`)),
      h(
        'div',
        { className: css(s.body) },
        h('h3', { className: css(s.title) }, p.title),
        h('div', { className: css(s.ratingTrack) }, h('div', { className: css(s.ratingFill) })),
        h('span', { className: css(s.priceNow) }, `$${p.price.toFixed(2)}`),
        h('button', { className: css(s.cart), disabled: !p.inStock }, p.inStock ? 'Add to cart' : 'Out of stock'),
      ),
    )
  }
  const PlainTile = (p: any, i: number) =>
    h(
      'article',
      { className: 'tile', key: i },
      h('div', { className: 'media' }, h('span', { className: 'badge' }, `-${p.discount}%`)),
      h(
        'div',
        { className: 'body' },
        h('h3', { className: 'title' }, p.title),
        h('div', { className: 'rating' }, h('div', { className: 'fill' })),
        h('span', { className: 'price' }, `$${p.price.toFixed(2)}`),
        h('button', { className: 'cart', disabled: !p.inStock }, p.inStock ? 'Add to cart' : 'Out of stock'),
      ),
    )

  const N = Number(process.env.TILES ?? 400)
  console.log(`node ${process.version} · react-dom/server · medians\n`)

  section(`1 · Shop page — ${N} tiles × 7 styled elements`)
  {
    const plain = measure(render(PlainTile, N), 60)
    const cssR = measure(render(CssTile, N), 60)
    const styledR = measure(render(StyledTile, N), 60)
    table(
      ['pattern', 'ms/render', 'renders/s', 'vs plain'],
      [
        ['plain el (floor)', ms(plain), rps(plain), x(plain, plain)],
        ['css fn', ms(cssR), rps(cssR), x(cssR, plain)],
        ['styled factory', ms(styledR), rps(styledR), x(styledR, plain)],
      ],
    )
  }

  section('2 · Scale — css fn vs styled factory')
  {
    const rows = [1, 100, 400, 1000].map((n) => {
      const c = measure(render(CssTile, n), n >= 400 ? 40 : 100)
      const s = measure(render(StyledTile, n), n >= 400 ? 40 : 100)
      return [`${n} tiles`, ms(c), ms(s), `${(s.ms / c.ms).toFixed(1)}x`]
    })
    table(['tiles', 'css fn', 'styled', 'styled/css'], rows)
  }

  section('3 · Per-call styling cost — single element, 50k renders')
  {
    const STYLE = styleFor(SHAPES[0]).article
    const recipe = cva({
      base: STYLE,
      variants: { tone: { light: { color: '#111827' }, dark: { color: '#f9fafb' } } },
    })
    let n = 0
    const uniq = () => ({ ...STYLE, marginTop: `${n++}px` })
    const el = (props: () => any) => () => renderToStaticMarkup(h('div', props()))

    const cssHot = measure(el(() => ({ className: css(STYLE) })), 50000)
    const cssCold = measure(el(() => ({ className: css(uniq()) })), 50000)
    const styledHot = measure(() => renderToStaticMarkup(h(styled.div, STYLE)), 50000)
    const styledCold = measure(() => renderToStaticMarkup(h(styled.div, uniq())), 50000)
    const cvaR = measure(el(() => ({ className: recipe({ tone: 'dark' }) })), 50000)

    const us = (r: Result) => `${(r.ms * 1000).toFixed(2)} µs`
    table(
      ['pattern', 'cached', 'cold (unique)', 'renders/s (cached)'],
      [
        ['css fn', us(cssHot), us(cssCold), rps(cssHot)],
        ['styled factory', us(styledHot), us(styledCold), rps(styledHot)],
        ['cva recipe', us(cvaR), '—', rps(cvaR)],
      ],
    )
    console.log('\n  "cached" = repeated styles (memo hit); "cold" = unique styles every render.')

    const ratio = cssCold.ms / cssHot.ms
    console.log(
      ratio > 2
        ? `  \x1b[32m✓ css() cache: cached is ${ratio.toFixed(1)}x cheaper than cold — content cache active.\x1b[0m`
        : `  \x1b[31m✗ css() cache: cached ≈ cold (${ratio.toFixed(1)}x) — content cache disabled (regression).\x1b[0m`,
    )
  }
  console.log()
}

main()
