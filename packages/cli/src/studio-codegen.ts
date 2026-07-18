import type { Spec } from '@pandacss/compiler-shared'
import { studioScript, studioStyle } from './studio-bundle.generated'

export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
}

export type StudioFramework = 'react' | 'solid'

export interface StudioFile {
  path: string
  code: string
}

const CATEGORY_ORDER = [
  'colors',
  'fontSizes',
  'fontWeights',
  'fonts',
  'lineHeights',
  'letterSpacings',
  'spacing',
  'sizes',
  'radii',
  'borders',
  'shadows',
  'blurs',
  'aspectRatios',
  'durations',
  'easings',
  'animations',
  'breakpoints',
]
const TYPE_CATEGORIES = ['fontSizes', 'fontWeights', 'fonts', 'lineHeights', 'letterSpacings']
const SCALE_CATEGORIES = ['spacing', 'sizes', 'breakpoints']
const GRID_KIND: Record<string, string> = {
  radii: 'radius',
  borders: 'border',
  shadows: 'shadow',
  blurs: 'blur',
  aspectRatios: 'ratio',
  animations: 'animation',
  easings: 'easing',
  durations: 'duration',
}

const jsArray = (items: string[]) => `[${items.map((item) => `'${item}'`).join(', ')}]`
const jsRecord = (record: Record<string, string>) =>
  `{ ${Object.entries(record)
    .map(([key, value]) => `${key}: '${value}'`)
    .join(', ')} }`

const GENERATE_VIEWS: Array<{ name: string; categories: string[] }> = [
  { name: 'Colors', categories: ['colors'] },
  { name: 'Typography', categories: TYPE_CATEGORIES },
  { name: 'Spacing', categories: ['spacing'] },
  { name: 'Sizes', categories: ['sizes'] },
  { name: 'Radii', categories: ['radii'] },
  { name: 'Shadows', categories: ['shadows'] },
  { name: 'Semantic', categories: ['semantic'] },
]

export function buildTokensSnapshot(spec: Spec, semantic: Record<string, Record<string, string>> = {}): StudioToken[] {
  const out: StudioToken[] = []
  for (const [category, meta] of Object.entries(spec.tokens.categories)) {
    for (const name of meta.values) {
      const path = `${category}.${name}`
      if (semantic[path]) continue
      const value = spec.tokens.values[path]
      if (value == null || value === '') continue
      out.push({ category, path, name, value })
    }
  }
  for (const [path, conditions] of Object.entries(semantic)) {
    const dot = path.indexOf('.')
    const category = dot === -1 ? path : path.slice(0, dot)
    const name = dot === -1 ? path : path.slice(dot + 1)
    const value = conditions.base ?? Object.values(conditions)[0]
    if (value == null || value === '') continue
    out.push({ category, path, name, value, conditions })
  }
  return out
}

export function buildSemanticMap(spec: Spec, config: unknown): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  const values = spec.tokens.values

  const resolve = (raw: unknown): string => {
    const str = String(raw)
    const ref = /^\{(.+)\}$/.exec(str.trim())
    return ref ? values[ref[1]] ?? str : str
  }

  const flatten = (raw: unknown, condition: string | undefined, into: Record<string, string>) => {
    if (raw && typeof raw === 'object') {
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        const next =
          key === 'base' && condition === undefined ? undefined : condition === undefined ? key : `${condition}:${key}`
        flatten(value, next, into)
      }
    } else {
      into[condition ?? 'base'] = resolve(raw)
    }
  }

  const walk = (node: unknown, category: string, segments: string[], theme: string) => {
    if (!node || typeof node !== 'object') return
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (!child || typeof child !== 'object') continue
      if ('value' in child) {
        const path = `${category}.${[...segments, key].join('.')}`
        out[path] ??= {}
        const conditions: Record<string, string> = {}
        flatten((child as { value: unknown }).value, undefined, conditions)
        for (const [condition, value] of Object.entries(conditions)) {
          out[path][theme ? `${theme} · ${condition}` : condition] = value
        }
      } else {
        walk(child, category, [...segments, key], theme)
      }
    }
  }

  const cfg = config as {
    theme?: { semanticTokens?: Record<string, unknown> }
    themes?: Record<string, { semanticTokens?: Record<string, unknown> }>
  }
  const addSet = (semanticTokens: Record<string, unknown> | undefined, theme: string) => {
    for (const [category, tokens] of Object.entries(semanticTokens ?? {})) walk(tokens, category, [], theme)
  }
  addSet(cfg?.theme?.semanticTokens, '')
  for (const [name, theme] of Object.entries(cfg?.themes ?? {})) addSet(theme?.semanticTokens, name)
  return out
}

export function tokensSnapshotFile(tokens: StudioToken[]): StudioFile {
  return { path: 'tokens.json', code: `${JSON.stringify(tokens, null, 2)}\n` }
}

export function viewFiles(tokens: StudioToken[], framework: StudioFramework, keyframesCss = ''): StudioFile[] {
  const templates = framework === 'solid' ? solidTemplates : reactTemplates
  const css = keyframesCss ? `${COMPONENT_CSS}\n${keyframesCss}` : COMPONENT_CSS
  return [
    tokensSnapshotFile(tokens),
    { path: 'studio.css', code: `${css}\n` },
    { path: 'helpers.ts', code: HELPERS_TS },
    { path: 'token-grid.tsx', code: templates.tokenGrid() },
    ...GENERATE_VIEWS.map((view) => ({
      path: `${view.name.toLowerCase()}.tsx`,
      code: templates.view(view.name, view.categories),
    })),
  ]
}

export function viewerFiles(tokens: StudioToken[], extraCss = '', logo = ''): StudioFile[] {
  const views = viewerViews(tokens)
  const pages = views.length ? views : [{ id: 'tokens', label: 'Tokens', group: 'tokens' as const }]
  const files: StudioFile[] = [
    tokensSnapshotFile(tokens),
    { path: 'studio.css', code: extraCss ? `${studioStyle}\n${extraCss}` : studioStyle },
    { path: 'studio.js', code: studioScript },
  ]
  pages.forEach((view, index) => {
    files.push({ path: index === 0 ? 'index.html' : `${view.id}.html`, code: viewerHtml(view, views, logo) })
  })
  return files
}

interface ViewerView {
  id: string
  label: string
  group: 'tokens' | 'semantic' | 'playground'
}

function viewerViews(tokens: StudioToken[]): ViewerView[] {
  const rank = (category: string) => {
    const index = CATEGORY_ORDER.indexOf(category)
    return index === -1 ? CATEGORY_ORDER.length : index
  }
  const categories = [...new Set(tokens.filter((token) => !token.conditions).map((token) => token.category))].sort(
    (a, b) => rank(a) - rank(b),
  )
  const views: ViewerView[] = categories.map((id) => ({ id, label: id, group: 'tokens' }))
  if (tokens.some((token) => token.conditions))
    views.push({ id: 'semantic', label: 'Semantic tokens', group: 'semantic' })
  if (tokens.length) views.push({ id: 'playground', label: 'Playground', group: 'playground' })
  if (tokens.some((token) => token.category === 'colors'))
    views.push({ id: 'contrast', label: 'Contrast', group: 'playground' })
  if (tokens.some((token) => TYPE_CATEGORIES.includes(token.category)))
    views.push({ id: 'typography', label: 'Typography', group: 'playground' })
  return views
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

export function fontfaceToCss(globalFontface: unknown): string {
  if (!globalFontface || typeof globalFontface !== 'object') return ''
  const kebab = (prop: string) => prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  const src = (value: unknown): string => {
    const one = (item: unknown) => {
      if (!item || typeof item !== 'object') return String(item)
      const entry = item as { url?: string; format?: string }
      return `url("${entry.url ?? ''}")${entry.format ? ` format("${entry.format}")` : ''}`
    }
    return Array.isArray(value) ? value.map(one).join(', ') : one(value)
  }
  const rule = (family: string, decls: Record<string, unknown>) => {
    const body = Object.entries(decls)
      .map(([prop, value]) => `${kebab(prop)}: ${prop === 'src' ? src(value) : String(value)}`)
      .join('; ')
    return `@font-face { font-family: "${family}"; ${body} }`
  }
  const blocks: string[] = []
  for (const [family, def] of Object.entries(globalFontface as Record<string, unknown>)) {
    if (family === 'extend' || !def || typeof def !== 'object') continue
    for (const one of Array.isArray(def) ? def : [def]) {
      if (one && typeof one === 'object') blocks.push(rule(family, one as Record<string, unknown>))
    }
  }
  return blocks.join('\n')
}

function viewerHtml(view: ViewerView, views: ViewerView[], logo = ''): string {
  const config = JSON.stringify({ views, current: view.id, logo })
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Panda Studio — ${view.label}</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🐼%3C/text%3E%3C/svg%3E" />
    <link rel="stylesheet" href="studio.css" />
  </head>
  <body>
    <div id="root"></div>
    <script>window.__STUDIO__ = ${config}</script>
    <script src="studio.js"></script>
  </body>
</html>
`
}

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
.panda-studio .semantic { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; align-items: start; }
.panda-studio .semantic-card { border: 1px solid var(--border); border-radius: 10px; background: var(--card); padding: 12px; }
.panda-studio .semantic-name { font-size: 12px; font-weight: 600; margin-bottom: 10px; }
.panda-studio .semantic-conds { display: flex; flex-direction: column; gap: 8px; }
.panda-studio .semantic-cond { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.panda-studio .semantic-cond .sw { width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0; }
.panda-studio .semantic-cond .label { font-weight: 600; min-width: 90px; }
.panda-studio .semantic-cond .cv { color: var(--muted); font-family: ui-monospace, monospace; word-break: break-all; }
.panda-studio .anim-box { width: 44px; height: 44px; border-radius: 8px; background: var(--accent); }
.panda-studio .ease-track { width: 100%; padding: 0 4px; }
.panda-studio .ease-dot { width: 18px; height: 18px; border-radius: 999px; background: var(--accent); animation: panda-studio-ease 1.4s infinite alternate; }
@keyframes panda-studio-ease { from { transform: translateX(0); } to { transform: translateX(130px); } }`

const HELPERS_TS = `export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
}

export const TYPE_CATEGORIES = new Set(${jsArray(TYPE_CATEGORIES)})
export const SCALE_CATEGORIES = new Set(${jsArray(SCALE_CATEGORIES)})
export const GRID_KIND: Record<string, string> = ${jsRecord(GRID_KIND)}
export const SAMPLE = 'The quick brown fox jumps over the lazy dog'

export const familyOf = (name: string) => (name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name)
export const shadeOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name)
export const byShade = (a: StudioToken, b: StudioToken) => (parseFloat(shadeOf(a.name)) || 0) - (parseFloat(shadeOf(b.name)) || 0)

export function toPx(value: string) {
  const match = /^([\\d.]+)(rem|em|px)$/.exec(value)
  return match ? (match[2] === 'px' ? parseFloat(match[1]) : parseFloat(match[1]) * 16) : NaN
}

export function groupFamilies(items: StudioToken[]) {
  const families = new Map<string, StudioToken[]>()
  for (const token of items) {
    const family = familyOf(token.name)
    if (!families.has(family)) families.set(family, [])
    families.get(family)!.push(token)
  }
  return [...families.entries()]
}

export function scaleWidth(px: number, min: number, max: number) {
  if (px <= 0) return 0
  if (max <= min) return 100
  return ((Math.log(px) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 98 + 2
}

export function scaleRows(items: StudioToken[]) {
  const rows = items
    .filter((token) => !token.name.includes('breakpoint-') && !Number.isNaN(toPx(token.value)))
    .map((token) => ({ token, px: toPx(token.value) }))
    .sort((a, b) => a.px - b.px)
  const maxPx = rows.length ? rows[rows.length - 1].px || 1 : 1
  const minPx = rows.find((row) => row.px > 0)?.px ?? maxPx
  return rows.map((row) => ({ ...row, width: scaleWidth(row.px, minPx, maxPx) }))
}
`

const reactTemplates = {
  tokenGrid: () => `import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import tokens from './tokens.json'
import css from './studio.css?raw'
import { GRID_KIND, SAMPLE, SCALE_CATEGORIES, TYPE_CATEGORIES, byShade, groupFamilies, scaleRows, shadeOf } from './helpers'
import type { StudioToken } from './helpers'

const all = tokens as StudioToken[]

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
    case 'ratio': return <div style={{ height: 64, aspectRatio: value, maxWidth: '100%', background: 'var(--swatch)', borderRadius: 6 }} />
    case 'animation': return <div className="anim-box" style={{ animation: value }} />
    case 'easing': return <div className="ease-track"><div className="ease-dot" style={{ animationTimingFunction: value }} /></div>
    case 'duration': return <div className="ease-track"><div className="ease-dot" style={{ animationDuration: value, animationTimingFunction: 'linear' }} /></div>
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

function Semantic({ items }: { items: StudioToken[] }) {
  return (
    <div className="semantic">
      {items.map((token) => (
        <div className="semantic-card" key={token.path}>
          <div className="semantic-name">{token.name}</div>
          <div className="semantic-conds">
            {Object.entries(token.conditions ?? {}).map(([label, value]) => (
              <div className="semantic-cond" key={label}>
                <div className="sw" style={{ background: value }} />
                <span className="label">{label}</span>
                <span className="cv">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TokenGrid({ category }: { category: string }) {
  const items =
    category === 'semantic'
      ? all.filter((token) => token.conditions)
      : all.filter((token) => token.category === category && !token.conditions)
  if (items.length === 0) return null

  return (
    <div className="panda-studio">
      <style>{css}</style>
      {category === 'semantic' ? (
        <Semantic items={items} />
      ) : category === 'colors' ? (
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
  view: (name: string, categories: string[]) => `import { TokenGrid } from './token-grid'

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
  tokenGrid: () => `import { For, Match, Switch } from 'solid-js'
import type { JSX } from 'solid-js'
import tokens from './tokens.json'
import css from './studio.css?raw'
import { GRID_KIND, SAMPLE, SCALE_CATEGORIES, TYPE_CATEGORIES, byShade, groupFamilies, scaleRows, shadeOf } from './helpers'
import type { StudioToken } from './helpers'

const all = tokens as StudioToken[]

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
    case 'ratio': return <div style={{ height: '64px', 'aspect-ratio': props.value, 'max-width': '100%', background: 'var(--swatch)', 'border-radius': '6px' }} />
    case 'animation': return <div class="anim-box" style={{ animation: props.value }} />
    case 'easing': return <div class="ease-track"><div class="ease-dot" style={{ 'animation-timing-function': props.value }} /></div>
    case 'duration': return <div class="ease-track"><div class="ease-dot" style={{ 'animation-duration': props.value, 'animation-timing-function': 'linear' }} /></div>
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

function Semantic(props: { items: StudioToken[] }) {
  return (
    <div class="semantic">
      <For each={props.items}>
        {(token) => (
          <div class="semantic-card">
            <div class="semantic-name">{token.name}</div>
            <div class="semantic-conds">
              <For each={Object.entries(token.conditions ?? {})}>
                {([label, value]) => (
                  <div class="semantic-cond">
                    <div class="sw" style={{ background: value }} />
                    <span class="label">{label}</span>
                    <span class="cv">{value}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

export function TokenGrid(props: { category: string }) {
  const items = () =>
    props.category === 'semantic'
      ? all.filter((token) => token.conditions)
      : all.filter((token) => token.category === props.category && !token.conditions)
  const mode = () =>
    props.category === 'semantic'
      ? 'semantic'
      : props.category === 'colors'
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
          <style>{css}</style>
          <Switch>
            <Match when={mode() === 'semantic'}><Semantic items={items()} /></Match>
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
  view: (name: string, categories: string[]) => `import { TokenGrid } from './token-grid'

export function ${name}() {
  return (
    <>
${categories.map((category) => `      <TokenGrid category="${category}" />`).join('\n')}
    </>
  )
}
`,
}
