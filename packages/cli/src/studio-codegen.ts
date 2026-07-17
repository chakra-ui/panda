import type { Spec } from '@pandacss/compiler-shared'

export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
}

export type StudioFramework = 'react' | 'solid'

export interface StudioFile {
  path: string
  code: string
}

const VIEWS: Array<{ name: string; categories: string[] }> = [
  { name: 'Colors', categories: ['colors'] },
  { name: 'Typography', categories: ['fontSizes', 'fontWeights', 'fonts', 'lineHeights', 'letterSpacings'] },
  { name: 'Spacing', categories: ['spacing'] },
  { name: 'Sizes', categories: ['sizes'] },
  { name: 'Radii', categories: ['radii'] },
  { name: 'Shadows', categories: ['shadows'] },
]

export function buildTokensSnapshot(spec: Spec): StudioToken[] {
  const out: StudioToken[] = []
  for (const [category, meta] of Object.entries(spec.tokens.categories)) {
    for (const name of meta.values) {
      const path = `${category}.${name}`
      const value = spec.tokens.values[path]
      if (value == null || value === '') continue
      out.push({ category, path, name, value })
    }
  }
  return out
}

export function tokensSnapshotFile(tokens: StudioToken[]): StudioFile {
  return { path: 'tokens.json', code: `${JSON.stringify(tokens, null, 2)}\n` }
}

export function viewFiles(tokens: StudioToken[], framework: StudioFramework, keyframesCss = ''): StudioFile[] {
  const templates = framework === 'solid' ? solidTemplates : reactTemplates
  return [
    tokensSnapshotFile(tokens),
    { path: 'components/token-grid.tsx', code: templates.tokenGrid(keyframesCss) },
    ...VIEWS.map((view) => ({ path: `${view.name}.tsx`, code: templates.view(view.name, view.categories) })),
  ]
}

export function viewerFiles(tokens: StudioToken[], keyframesCss = ''): StudioFile[] {
  return [
    tokensSnapshotFile(tokens),
    { path: 'index.html', code: VIEWER_HTML },
    { path: 'studio.css', code: keyframesCss ? `${VIEWER_CSS}\n${keyframesCss}` : VIEWER_CSS },
    { path: 'studio.js', code: VIEWER_JS },
  ]
}

export function keyframesToCss(keyframes: unknown): string {
  if (!keyframes || typeof keyframes !== 'object') return ''
  const kebab = (prop: string) => prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  const blocks: string[] = []
  for (const [name, frames] of Object.entries(keyframes as Record<string, unknown>)) {
    if (!frames || typeof frames !== 'object') continue
    const steps = Object.entries(frames as Record<string, unknown>)
      .map(([step, decls]) => {
        if (!decls || typeof decls !== 'object') return ''
        const props = Object.entries(decls as Record<string, unknown>)
          .map(([prop, value]) => `${kebab(prop)}: ${String(value)}`)
          .join('; ')
        return `${step} { ${props} }`
      })
      .filter(Boolean)
      .join(' ')
    if (steps) blocks.push(`@keyframes ${name} { ${steps} }`)
  }
  return blocks.join('\n')
}

const VIEWER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Panda Studio</title>
    <link rel="stylesheet" href="studio.css" />
  </head>
  <body>
    <div class="wrap">
      <header>
        <span class="logo">🐼</span>
        <h1>Panda Studio</h1>
        <span class="count" id="count"></span>
        <button class="theme" id="theme" type="button" aria-label="Toggle color theme"></button>
      </header>
      <main id="grid"></main>
    </div>
    <script src="studio.js"></script>
  </body>
</html>
`

const VIEWER_CSS = `:root {
  color-scheme: light;
  --bg: #ffffff;
  --fg: #1a1a1a;
  --muted: #71717a;
  --border: #e4e4e7;
  --card: #fafafa;
  --swatch: #d4d4d8;
  --shadow-bg: #ffffff;
  --accent: #f6e458;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { color-scheme: dark; --bg: #0d0d0f; --fg: #f4f4f5; --muted: #8f8f99; --border: #26262a; --card: #161619; --swatch: #3f3f46; --shadow-bg: #f4f4f5; }
}
:root[data-theme='dark'] { color-scheme: dark; --bg: #0d0d0f; --fg: #f4f4f5; --muted: #8f8f99; --border: #26262a; --card: #161619; --swatch: #3f3f46; --shadow-bg: #f4f4f5; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: -apple-system, system-ui, sans-serif; }
.wrap { max-width: 1080px; margin: 0 auto; padding: 40px 24px 80px; }
header { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
header .logo { font-size: 22px; line-height: 1; }
header h1 { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
header .count { margin-left: auto; color: var(--muted); font-size: 13px; }
.theme { width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--fg); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.theme:hover { border-color: var(--accent); }
section { margin-bottom: 44px; }
section h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-items: start; }
.card { border: 1px solid var(--border); border-radius: 10px; background: var(--card); padding: 12px; }
.preview { height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 10px; }
.name { font-size: 12px; font-weight: 600; }
.value { font-size: 11px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, monospace; margin-top: 3px; word-break: break-word; }
.chip { width: 48px; height: 48px; border-radius: 8px; }
.palette { margin-bottom: 24px; }
.palette-name { font-size: 13px; font-weight: 600; text-transform: capitalize; margin: 0 0 10px; }
.shades { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; }
.shade-chip { height: 56px; border-radius: 8px; border: 1px solid var(--border); }
.shade-name { font-size: 11px; font-weight: 600; margin-top: 6px; }
.shade-value { font-size: 10px; color: var(--muted); font-family: ui-monospace, monospace; word-break: break-all; }
.type-list { display: flex; flex-direction: column; gap: 24px; }
.type-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px; }
.type-name { font-size: 12px; font-weight: 600; }
.type-value { font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; }
.type-sample { overflow: hidden; }
.scale { display: grid; grid-template-columns: max-content max-content max-content 1fr; column-gap: 24px; row-gap: 12px; align-items: center; }
.scale .s-name { font-size: 13px; font-weight: 600; }
.scale .s-value { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
.scale .s-px { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
.scale .s-track { background: var(--card); border-radius: 999px; }
.scale .s-bar { height: 12px; border-radius: 999px; background: var(--accent); }
.anim-box { width: 44px; height: 44px; border-radius: 8px; background: var(--accent); }
.ease-track { width: 100%; padding: 0 4px; }
.ease-dot { width: 18px; height: 18px; border-radius: 999px; background: var(--accent); animation: panda-studio-ease 1.4s infinite alternate; }
@keyframes panda-studio-ease { from { transform: translateX(0); } to { transform: translateX(130px); } }
`

const VIEWER_JS = `const root = document.documentElement
const stored = localStorage.getItem('panda-studio-theme')
if (stored) root.setAttribute('data-theme', stored)

function activeTheme() {
  return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

const themeButton = document.getElementById('theme')
function renderThemeButton() {
  themeButton.textContent = activeTheme() === 'dark' ? '☀' : '☾'
}
themeButton.addEventListener('click', () => {
  const next = activeTheme() === 'dark' ? 'light' : 'dark'
  root.setAttribute('data-theme', next)
  localStorage.setItem('panda-studio-theme', next)
  renderThemeButton()
})
renderThemeButton()

const CATEGORY_ORDER = ['colors', 'fontSizes', 'fontWeights', 'fonts', 'lineHeights', 'letterSpacings', 'spacing', 'sizes', 'radii', 'borders', 'shadows', 'blurs', 'aspectRatios', 'durations', 'easings', 'animations', 'breakpoints']
const TYPE_CATEGORIES = new Set(['fontSizes', 'fontWeights', 'fonts', 'lineHeights', 'letterSpacings'])
const SCALE_CATEGORIES = new Set(['spacing', 'sizes'])
const GRID_KIND = { radii: 'radius', borders: 'border', shadows: 'shadow', blurs: 'blur', aspectRatios: 'ratio', animations: 'animation', easings: 'easing' }
const SAMPLE = 'The quick brown fox jumps over the lazy dog'

function toPx(value) {
  const match = /^([\\d.]+)(rem|em|px)$/.exec(value)
  if (!match) return NaN
  return match[2] === 'px' ? parseFloat(match[1]) : parseFloat(match[1]) * 16
}

function renderScale(container, tokens) {
  const rows = tokens
    .filter((token) => !token.name.includes('breakpoint-') && !Number.isNaN(toPx(token.value)))
    .map((token) => ({ token, px: toPx(token.value) }))
    .sort((a, b) => a.px - b.px)
  if (rows.length === 0) return

  const maxPx = rows[rows.length - 1].px || 1
  const scale = document.createElement('div')
  scale.className = 'scale'
  for (const { token, px } of rows) {
    const name = document.createElement('div')
    name.className = 's-name'
    name.textContent = token.name
    const value = document.createElement('div')
    value.className = 's-value'
    value.textContent = token.value
    const pixels = document.createElement('div')
    pixels.className = 's-px'
    pixels.textContent = Math.round(px) + 'px'
    const track = document.createElement('div')
    track.className = 's-track'
    const bar = document.createElement('div')
    bar.className = 's-bar'
    bar.style.width = Math.max((px / maxPx) * 100, 2) + '%'
    track.appendChild(bar)
    scale.append(name, value, pixels, track)
  }
  container.appendChild(scale)
}

function familyOf(name) { const i = name.lastIndexOf('.'); return i === -1 ? name : name.slice(0, i) }
function shadeOf(name) { const i = name.lastIndexOf('.'); return i === -1 ? name : name.slice(i + 1) }

function renderColors(container, tokens) {
  const families = new Map()
  for (const token of tokens) {
    const family = familyOf(token.name)
    if (!families.has(family)) families.set(family, [])
    families.get(family).push(token)
  }
  for (const [family, shades] of families) {
    const group = document.createElement('div')
    group.className = 'palette'
    const label = document.createElement('div')
    label.className = 'palette-name'
    label.textContent = family
    const row = document.createElement('div')
    row.className = 'shades'
    const sorted = shades.slice().sort((a, b) => (parseFloat(shadeOf(a.name)) || 0) - (parseFloat(shadeOf(b.name)) || 0))
    for (const token of sorted) {
      const cell = document.createElement('div')
      const chip = document.createElement('div')
      chip.className = 'shade-chip'
      chip.style.background = token.value
      chip.title = token.value
      const name = document.createElement('div')
      name.className = 'shade-name'
      name.textContent = shadeOf(token.name)
      const value = document.createElement('div')
      value.className = 'shade-value'
      value.textContent = token.value
      cell.append(chip, name, value)
      row.appendChild(cell)
    }
    group.append(label, row)
    container.appendChild(group)
  }
}

function applyType(el, category, value) {
  if (category === 'fontSizes') el.style.fontSize = value
  else if (category === 'fontWeights') { el.style.fontWeight = value; el.style.fontSize = '1.75rem' }
  else if (category === 'fonts') { el.style.fontFamily = value; el.style.fontSize = '1.75rem' }
  else if (category === 'lineHeights') { el.style.lineHeight = value; el.style.maxWidth = '540px'; el.textContent = SAMPLE + '. ' + SAMPLE + '.' }
  else if (category === 'letterSpacings') { el.style.letterSpacing = value; el.style.fontSize = '1.25rem' }
}

function renderType(container, category, tokens) {
  const list = document.createElement('div')
  list.className = 'type-list'
  for (const token of tokens) {
    const row = document.createElement('div')
    const meta = document.createElement('div')
    meta.className = 'type-meta'
    const name = document.createElement('span')
    name.className = 'type-name'
    name.textContent = token.name
    const value = document.createElement('span')
    value.className = 'type-value'
    value.textContent = token.value
    meta.append(name, value)
    const sample = document.createElement('div')
    sample.className = 'type-sample'
    sample.textContent = SAMPLE
    applyType(sample, category, token.value)
    row.append(meta, sample)
    list.appendChild(row)
  }
  container.appendChild(list)
}

function makePreview(category, value) {
  const kind = GRID_KIND[category]
  if (!kind) return null

  const wrap = document.createElement('div')
  wrap.className = 'preview'

  if (kind === 'radius' || kind === 'border' || kind === 'shadow' || kind === 'blur') {
    const chip = document.createElement('div')
    chip.className = 'chip'
    if (kind === 'radius') { chip.style.background = 'var(--swatch)'; chip.style.borderRadius = value }
    if (kind === 'border') chip.style.border = value
    if (kind === 'shadow') { chip.style.background = 'var(--shadow-bg)'; chip.style.boxShadow = value }
    if (kind === 'blur') { chip.style.background = 'linear-gradient(135deg, var(--accent), #ec4899)'; chip.style.filter = 'blur(' + value + ')' }
    wrap.appendChild(chip)
    return wrap
  }
  if (kind === 'animation') {
    const box = document.createElement('div')
    box.className = 'anim-box'
    box.style.animation = value
    wrap.appendChild(box)
    return wrap
  }
  if (kind === 'easing') {
    const track = document.createElement('div')
    track.className = 'ease-track'
    const dot = document.createElement('div')
    dot.className = 'ease-dot'
    dot.style.animationTimingFunction = value
    track.appendChild(dot)
    wrap.appendChild(track)
    return wrap
  }
  const chip = document.createElement('div')
  chip.style.height = '48px'
  chip.style.aspectRatio = value
  chip.style.background = 'var(--swatch)'
  chip.style.borderRadius = '6px'
  wrap.appendChild(chip)
  return wrap
}

function makeCard(token) {
  const card = document.createElement('div')
  card.className = 'card'
  const preview = makePreview(token.category, token.value)
  if (preview) card.appendChild(preview)
  const name = document.createElement('div')
  name.className = 'name'
  name.textContent = token.name
  const value = document.createElement('div')
  value.className = 'value'
  value.textContent = token.value
  card.append(name, value)
  return card
}

fetch('tokens.json').then((res) => res.json()).then((tokens) => {
  const grid = document.getElementById('grid')
  document.getElementById('count').textContent = tokens.length + ' tokens'

  const byCategory = new Map()
  for (const token of tokens) {
    if (!byCategory.has(token.category)) byCategory.set(token.category, [])
    byCategory.get(token.category).push(token)
  }

  const rank = (category) => {
    const index = CATEGORY_ORDER.indexOf(category)
    return index === -1 ? CATEGORY_ORDER.length : index
  }

  for (const category of [...byCategory.keys()].sort((a, b) => rank(a) - rank(b))) {
    const section = document.createElement('section')
    const heading = document.createElement('h2')
    heading.textContent = category
    const body = document.createElement('div')
    if (category === 'colors') renderColors(body, byCategory.get(category))
    else if (TYPE_CATEGORIES.has(category)) renderType(body, category, byCategory.get(category))
    else if (SCALE_CATEGORIES.has(category)) renderScale(body, byCategory.get(category))
    else {
      body.className = 'grid'
      for (const token of byCategory.get(category)) body.appendChild(makeCard(token))
    }
    section.append(heading, body)
    grid.appendChild(section)
  }
})
`

const COMPONENT_CSS = `.panda-studio { --fg: #1a1a1a; --muted: #71717a; --border: #e4e4e7; --card: #fafafa; --swatch: #d4d4d8; --shadow-bg: #ffffff; --accent: #f6e458; color: var(--fg); font-family: -apple-system, system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { .panda-studio { --fg: #f4f4f5; --muted: #8f8f99; --border: #26262a; --card: #161619; --swatch: #3f3f46; --shadow-bg: #f4f4f5; } }
.panda-studio .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-items: start; }
.panda-studio .card { border: 1px solid var(--border); border-radius: 10px; background: var(--card); padding: 12px; }
.panda-studio .preview { height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 10px; }
.panda-studio .name { font-size: 12px; font-weight: 600; }
.panda-studio .value { font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; margin-top: 3px; word-break: break-word; }
.panda-studio .chip { width: 48px; height: 48px; border-radius: 8px; }
.panda-studio .palette { margin-bottom: 24px; }
.panda-studio .palette-name { font-size: 13px; font-weight: 600; text-transform: capitalize; margin: 0 0 10px; }
.panda-studio .shades { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; }
.panda-studio .shade-chip { height: 56px; border-radius: 8px; border: 1px solid var(--border); }
.panda-studio .shade-name { font-size: 11px; font-weight: 600; margin-top: 6px; }
.panda-studio .shade-value { font-size: 10px; color: var(--muted); font-family: ui-monospace, monospace; word-break: break-all; }
.panda-studio .type-list { display: flex; flex-direction: column; gap: 24px; }
.panda-studio .type-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px; }
.panda-studio .type-name { font-size: 12px; font-weight: 600; }
.panda-studio .type-value { font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; }
.panda-studio .type-sample { overflow: hidden; }
.panda-studio .scale { display: grid; grid-template-columns: max-content max-content max-content 1fr; column-gap: 24px; row-gap: 12px; align-items: center; }
.panda-studio .s-name { font-size: 13px; font-weight: 600; }
.panda-studio .s-value { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
.panda-studio .s-px { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
.panda-studio .s-track { background: var(--card); border-radius: 999px; }
.panda-studio .s-bar { height: 12px; border-radius: 999px; background: var(--accent); }
.panda-studio .anim-box { width: 44px; height: 44px; border-radius: 8px; background: var(--accent); }
.panda-studio .ease-track { width: 100%; padding: 0 4px; }
.panda-studio .ease-dot { width: 18px; height: 18px; border-radius: 999px; background: var(--accent); animation: panda-studio-ease 1.4s infinite alternate; }
@keyframes panda-studio-ease { from { transform: translateX(0); } to { transform: translateX(130px); } }`

const SHARED_HELPERS = `const TYPE_CATEGORIES = new Set(['fontSizes', 'fontWeights', 'fonts', 'lineHeights', 'letterSpacings'])
const SCALE_CATEGORIES = new Set(['spacing', 'sizes'])
const GRID_KIND: Record<string, string> = { radii: 'radius', borders: 'border', shadows: 'shadow', blurs: 'blur', aspectRatios: 'ratio', animations: 'animation', easings: 'easing' }
const SAMPLE = 'The quick brown fox jumps over the lazy dog'

const familyOf = (name: string) => (name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name)
const shadeOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name)
const byShade = (a: StudioToken, b: StudioToken) => (parseFloat(shadeOf(a.name)) || 0) - (parseFloat(shadeOf(b.name)) || 0)

function toPx(value: string) {
  const match = /^([\\d.]+)(rem|em|px)$/.exec(value)
  return match ? (match[2] === 'px' ? parseFloat(match[1]) : parseFloat(match[1]) * 16) : NaN
}

function groupFamilies(items: StudioToken[]) {
  const families = new Map<string, StudioToken[]>()
  for (const token of items) {
    const family = familyOf(token.name)
    if (!families.has(family)) families.set(family, [])
    families.get(family)!.push(token)
  }
  return [...families.entries()]
}

function scaleRows(items: StudioToken[]) {
  const rows = items
    .filter((token) => !token.name.includes('breakpoint-') && !Number.isNaN(toPx(token.value)))
    .map((token) => ({ token, px: toPx(token.value) }))
    .sort((a, b) => a.px - b.px)
  const maxPx = rows.length ? rows[rows.length - 1].px || 1 : 1
  return rows.map((row) => ({ ...row, width: Math.max((row.px / maxPx) * 100, 2) }))
}`

const reactTemplates = {
  tokenGrid: (keyframesCss: string) => `import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import tokens from '../tokens.json'

interface StudioToken {
  category: string
  path: string
  name: string
  value: string
}

const all = tokens as StudioToken[]
const CSS = \`${COMPONENT_CSS}\n${keyframesCss}\`
${SHARED_HELPERS}

function typeStyle(category: string, value: string): CSSProperties {
  switch (category) {
    case 'fontSizes': return { fontSize: value }
    case 'fontWeights': return { fontWeight: value as CSSProperties['fontWeight'], fontSize: '1.75rem' }
    case 'fonts': return { fontFamily: value, fontSize: '1.75rem' }
    case 'lineHeights': return { lineHeight: value, maxWidth: 540 }
    case 'letterSpacings': return { letterSpacing: value, fontSize: '1.25rem' }
    default: return {}
  }
}

function GridPreview({ category, value }: { category: string; value: string }) {
  switch (GRID_KIND[category]) {
    case 'radius': return <div className="chip" style={{ background: 'var(--swatch)', borderRadius: value }} />
    case 'border': return <div className="chip" style={{ border: value }} />
    case 'shadow': return <div className="chip" style={{ background: 'var(--shadow-bg)', boxShadow: value }} />
    case 'blur': return <div className="chip" style={{ background: 'linear-gradient(135deg, var(--accent), #ec4899)', filter: \`blur(\${value})\` }} />
    case 'ratio': return <div style={{ height: 48, aspectRatio: value, background: 'var(--swatch)', borderRadius: 6 }} />
    case 'animation': return <div className="anim-box" style={{ animation: value }} />
    case 'easing': return <div className="ease-track"><div className="ease-dot" style={{ animationTimingFunction: value }} /></div>
    default: return null
  }
}

function Palette({ items }: { items: StudioToken[] }) {
  return (
    <>
      {groupFamilies(items).map(([family, shades]) => (
        <div className="palette" key={family}>
          <div className="palette-name">{family}</div>
          <div className="shades">
            {[...shades].sort(byShade).map((token) => (
              <div key={token.path}>
                <div className="shade-chip" style={{ background: token.value }} title={token.value} />
                <div className="shade-name">{shadeOf(token.name)}</div>
                <div className="shade-value">{token.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function TypeList({ category, items }: { category: string; items: StudioToken[] }) {
  return (
    <div className="type-list">
      {items.map((token) => (
        <div key={token.path}>
          <div className="type-meta">
            <span className="type-name">{token.name}</span>
            <span className="type-value">{token.value}</span>
          </div>
          <div className="type-sample" style={typeStyle(category, token.value)}>
            {category === 'lineHeights' ? SAMPLE + '. ' + SAMPLE + '.' : SAMPLE}
          </div>
        </div>
      ))}
    </div>
  )
}

function Scale({ items }: { items: StudioToken[] }) {
  return (
    <div className="scale">
      {scaleRows(items).map(({ token, px, width }) => (
        <Fragment key={token.path}>
          <div className="s-name">{token.name}</div>
          <div className="s-value">{token.value}</div>
          <div className="s-px">{Math.round(px)}px</div>
          <div className="s-track"><div className="s-bar" style={{ width: \`\${width}%\` }} /></div>
        </Fragment>
      ))}
    </div>
  )
}

export function TokenGrid({ category }: { category: string }) {
  const items = all.filter((token) => token.category === category)
  if (items.length === 0) return null

  return (
    <div className="panda-studio">
      <style>{CSS}</style>
      {category === 'colors' ? (
        <Palette items={items} />
      ) : TYPE_CATEGORIES.has(category) ? (
        <TypeList category={category} items={items} />
      ) : SCALE_CATEGORIES.has(category) ? (
        <Scale items={items} />
      ) : (
        <div className="grid">
          {items.map((token) => (
            <div className="card" key={token.path}>
              <div className="preview"><GridPreview category={token.category} value={token.value} /></div>
              <div className="name">{token.name}</div>
              <div className="value">{token.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
`,
  view: (name: string, categories: string[]) => `import { TokenGrid } from './components/token-grid'

export function ${name}() {
  return (
    <>
${categories.map((category) => `      <TokenGrid category="${category}" />`).join('\n')}
    </>
  )
}
`,
}

const solidTemplates = {
  tokenGrid: (keyframesCss: string) => `import { For, Match, Switch } from 'solid-js'
import type { JSX } from 'solid-js'
import tokens from '../tokens.json'

interface StudioToken {
  category: string
  path: string
  name: string
  value: string
}

const all = tokens as StudioToken[]
const CSS = \`${COMPONENT_CSS}\n${keyframesCss}\`
${SHARED_HELPERS}

function typeStyle(category: string, value: string): JSX.CSSProperties {
  switch (category) {
    case 'fontSizes': return { 'font-size': value }
    case 'fontWeights': return { 'font-weight': value, 'font-size': '1.75rem' }
    case 'fonts': return { 'font-family': value, 'font-size': '1.75rem' }
    case 'lineHeights': return { 'line-height': value, 'max-width': '540px' }
    case 'letterSpacings': return { 'letter-spacing': value, 'font-size': '1.25rem' }
    default: return {}
  }
}

function GridPreview(props: { category: string; value: string }) {
  switch (GRID_KIND[props.category]) {
    case 'radius': return <div class="chip" style={{ background: 'var(--swatch)', 'border-radius': props.value }} />
    case 'border': return <div class="chip" style={{ border: props.value }} />
    case 'shadow': return <div class="chip" style={{ background: 'var(--shadow-bg)', 'box-shadow': props.value }} />
    case 'blur': return <div class="chip" style={{ background: 'linear-gradient(135deg, var(--accent), #ec4899)', filter: \`blur(\${props.value})\` }} />
    case 'ratio': return <div style={{ height: '48px', 'aspect-ratio': props.value, background: 'var(--swatch)', 'border-radius': '6px' }} />
    case 'animation': return <div class="anim-box" style={{ animation: props.value }} />
    case 'easing': return <div class="ease-track"><div class="ease-dot" style={{ 'animation-timing-function': props.value }} /></div>
    default: return null
  }
}

function Palette(props: { items: StudioToken[] }) {
  return (
    <For each={groupFamilies(props.items)}>
      {([family, shades]) => (
        <div class="palette">
          <div class="palette-name">{family}</div>
          <div class="shades">
            <For each={[...shades].sort(byShade)}>
              {(token) => (
                <div>
                  <div class="shade-chip" style={{ background: token.value }} title={token.value} />
                  <div class="shade-name">{shadeOf(token.name)}</div>
                  <div class="shade-value">{token.value}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </For>
  )
}

function TypeList(props: { category: string; items: StudioToken[] }) {
  return (
    <div class="type-list">
      <For each={props.items}>
        {(token) => (
          <div>
            <div class="type-meta">
              <span class="type-name">{token.name}</span>
              <span class="type-value">{token.value}</span>
            </div>
            <div class="type-sample" style={typeStyle(props.category, token.value)}>
              {props.category === 'lineHeights' ? SAMPLE + '. ' + SAMPLE + '.' : SAMPLE}
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

function Scale(props: { items: StudioToken[] }) {
  return (
    <div class="scale">
      <For each={scaleRows(props.items)}>
        {(row) => (
          <>
            <div class="s-name">{row.token.name}</div>
            <div class="s-value">{row.token.value}</div>
            <div class="s-px">{Math.round(row.px)}px</div>
            <div class="s-track"><div class="s-bar" style={{ width: \`\${row.width}%\` }} /></div>
          </>
        )}
      </For>
    </div>
  )
}

export function TokenGrid(props: { category: string }) {
  const items = () => all.filter((token) => token.category === props.category)
  const mode = () =>
    props.category === 'colors'
      ? 'palette'
      : TYPE_CATEGORIES.has(props.category)
        ? 'type'
        : SCALE_CATEGORIES.has(props.category)
          ? 'scale'
          : 'grid'

  return (
    <Switch>
      <Match when={items().length === 0}>{null}</Match>
      <Match when={items().length > 0}>
        <div class="panda-studio">
          <style>{CSS}</style>
          <Switch>
            <Match when={mode() === 'palette'}><Palette items={items()} /></Match>
            <Match when={mode() === 'type'}><TypeList category={props.category} items={items()} /></Match>
            <Match when={mode() === 'scale'}><Scale items={items()} /></Match>
            <Match when={mode() === 'grid'}>
              <div class="grid">
                <For each={items()}>
                  {(token) => (
                    <div class="card">
                      <div class="preview"><GridPreview category={token.category} value={token.value} /></div>
                      <div class="name">{token.name}</div>
                      <div class="value">{token.value}</div>
                    </div>
                  )}
                </For>
              </div>
            </Match>
          </Switch>
        </div>
      </Match>
    </Switch>
  )
}
`,
  view: (name: string, categories: string[]) => `import { TokenGrid } from './components/token-grid'

export function ${name}() {
  return (
    <>
${categories.map((category) => `      <TokenGrid category="${category}" />`).join('\n')}
    </>
  )
}
`,
}
