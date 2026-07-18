import type { Spec } from '@pandacss/compiler-shared'

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

const PANDA_MARK =
  '<svg class="logo" viewBox="0 0 15 15" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10.7608 0.390669C9.38613 -0.0126127 7.98396 -0.067426 6.55506 0.0630881C5.75542 0.147945 4.98667 0.310054 4.24518 0.594509C2.64244 1.20936 1.43903 2.27424 0.72147 3.87754C0.207033 5.02698 0.0211109 6.24802 0.0017347 7.50081C-0.0187424 8.8248 0.143717 10.1305 0.401862 11.4249C0.635852 12.5983 0.947463 13.7487 1.39249 14.8591C1.43477 14.9646 1.48743 15.0002 1.60028 15C3.0078 14.9969 4.41533 14.9969 5.82286 14.9969C6.23955 14.9969 6.65623 14.9969 7.07292 14.9968C7.10483 14.9968 7.13673 14.995 7.17342 14.993C7.19215 14.9919 7.21213 14.9908 7.23399 14.9898C7.22553 14.9693 7.21796 14.9504 7.21087 14.9327C7.19692 14.8979 7.18479 14.8676 7.17125 14.838C7.06947 14.6156 6.96558 14.3942 6.86169 14.1728C6.63635 13.6924 6.41101 13.2121 6.20721 12.7224C5.5891 11.2373 5.11575 9.7082 4.9713 8.08959C4.90756 7.37541 4.91641 6.66531 5.11044 5.96941C5.33222 5.17396 5.80814 4.6124 6.59715 4.37763C7.32168 4.16204 8.05629 4.16346 8.77688 4.40144C9.42 4.61383 9.8393 5.06248 10.0176 5.73423C10.1546 6.25013 10.1546 6.77159 10.051 7.29169C9.97115 7.69214 9.81051 8.05756 9.52137 8.34988C9.00271 8.87423 8.35495 8.9948 7.6599 8.95462C7.53624 8.94747 7.41295 8.93362 7.28592 8.91936C7.22642 8.91267 7.16609 8.9059 7.10452 8.89968C7.10629 8.91977 7.10727 8.93828 7.10819 8.95562C7.10999 8.98973 7.11156 9.01931 7.11843 9.04755C7.14805 9.16913 7.17627 9.29115 7.2045 9.41319C7.27249 9.70715 7.3405 10.0012 7.42793 10.289C7.59961 10.8542 7.79925 11.4058 8.02556 11.9443C9.63883 11.8158 11.1248 11.4062 12.7019 10.4393C12.7256 10.4241 12.7471 10.4103 12.7686 10.3966C13.4461 9.96587 13.9944 9.40712 14.3725 8.68563C14.9848 7.51725 15.1042 6.26777 14.9223 4.97808C14.7345 3.64712 14.1497 2.52993 13.1429 1.6536C12.4446 1.0458 11.6371 0.647746 10.7608 0.390669Z"/></svg>'

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
  return [
    tokensSnapshotFile(tokens),
    { path: 'components/token-grid.tsx', code: templates.tokenGrid(keyframesCss) },
    ...GENERATE_VIEWS.map((view) => ({ path: `${view.name}.tsx`, code: templates.view(view.name, view.categories) })),
  ]
}

export function viewerFiles(tokens: StudioToken[], keyframesCss = ''): StudioFile[] {
  const views = viewerViews(tokens)
  const pages = views.length ? views : [{ id: 'tokens', label: 'Tokens', group: 'tokens' as const }]
  const files: StudioFile[] = [
    tokensSnapshotFile(tokens),
    { path: 'studio.css', code: keyframesCss ? `${VIEWER_CSS}\n${keyframesCss}` : VIEWER_CSS },
    { path: 'studio.js', code: VIEWER_JS },
  ]
  pages.forEach((view, index) => {
    files.push({ path: index === 0 ? 'index.html' : `${view.id}.html`, code: viewerHtml(view, views) })
  })
  return files
}

interface ViewerView {
  id: string
  label: string
  group: 'tokens' | 'playground'
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
    views.splice(1, 0, { id: 'semantic', label: 'semantic tokens', group: 'tokens' })
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

function viewerHtml(view: ViewerView, views: ViewerView[]): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Panda Studio — ${view.label}</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🐼%3C/text%3E%3C/svg%3E" />
    <link rel="stylesheet" href="studio.css" />
  </head>
  <body data-view="${view.id}">
    <div class="app">
      <aside class="sidebar">
        <div class="brand">${PANDA_MARK} Panda Studio</div>
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input class="search" id="search" type="search" placeholder="Filter tokens…" aria-label="Filter tokens" />
        </div>
        <nav class="nav">
          <div class="nav-label">Tokens</div>
          <ul id="nav"></ul>
          <div class="nav-label nav-label-spaced" id="nav-play-label">Playground</div>
          <ul id="nav-play"></ul>
        </nav>
      </aside>
      <main class="content">
        <div class="content-head"><nav class="crumb" id="crumb"></nav><span class="count" id="count"></span></div>
        <div id="grid"></div>
        <div id="tools"></div>
      </main>
      <button class="theme" id="theme" type="button" aria-label="Toggle color theme"></button>
    </div>
    <script id="views" type="application/json">${JSON.stringify(views)}</script>
    <script src="studio.js"></script>
  </body>
</html>
`
}

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
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: -apple-system, system-ui, sans-serif; }
.app { display: flex; min-height: 100vh; }
.sidebar { width: 240px; flex-shrink: 0; height: 100vh; position: sticky; top: 0; overflow: auto; border-right: 1px solid var(--border); padding: 24px 16px; display: flex; flex-direction: column; gap: 20px; }
.brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
.brand .logo { font-size: 20px; line-height: 1; }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; color: var(--muted); pointer-events: none; }
.search { width: 100%; padding: 8px 10px 8px 32px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--fg); font-size: 13px; }
.search::placeholder { color: var(--muted); }
.search:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent); }
.nav { display: flex; flex-direction: column; }
.nav-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
.nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
.nav a { display: block; padding: 6px 10px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--fg); text-decoration: none; text-transform: capitalize; }
.nav a:hover { background: var(--card); }
.nav a.active { background: var(--accent); color: #1a1a1a; }
.theme { position: fixed; top: 14px; right: 20px; z-index: 20; width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--fg); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.theme:hover { border-color: var(--accent); }
.content { flex: 1; min-width: 0; padding: 28px 40px 80px; }
.content-head { margin-bottom: 24px; min-height: 16px; }
.crumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin-bottom: 6px; text-transform: capitalize; }
.crumb .sep { opacity: 0.5; }
.crumb .here { color: var(--fg); font-weight: 600; }
.content .count { color: var(--muted); font-size: 13px; }
section { margin-bottom: 44px; scroll-margin-top: 24px; }
section h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-items: start; }
.card { border: 1px solid var(--border); border-radius: 10px; background: var(--card); padding: 12px; }
.preview { height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 10px; }
.name { font-size: 12px; font-weight: 600; }
.value { font-size: 11px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, monospace; margin-top: 3px; word-break: break-word; }
.chip { width: 48px; height: 48px; border-radius: 8px; }
.preview-shadow { height: auto; overflow: visible; }
.shadow-pair { display: flex; gap: 8px; width: 100%; }
.shadow-cell { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 12px; border-radius: 8px; }
.shadow-cell .chip { background: var(--card); }
.force-light { --card: #ffffff; background: #ffffff; }
.force-dark { --card: #1c1c20; background: #0d0d0f; }
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
.sort-control { margin-bottom: 18px; }
.sort-control label { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
.sort-control select { padding: 5px 8px; border: 1px solid var(--border); border-radius: 7px; background: var(--card); color: var(--fg); font-size: 12px; }
.scale { display: grid; grid-template-columns: max-content max-content max-content 1fr; column-gap: 24px; row-gap: 12px; align-items: center; }
.scale .s-name { font-size: 13px; font-weight: 600; }
.scale .s-value { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
.scale .s-px { font-size: 12px; color: var(--muted); font-family: ui-monospace, monospace; }
.scale .s-track { background: var(--card); border-radius: 999px; }
.scale .s-bar { height: 12px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 55%, transparent); }
.anim-box { width: 44px; height: 44px; border-radius: 8px; background: var(--accent); }
.ease-track { width: 100%; padding: 0 4px; }
.ease-dot { width: 18px; height: 18px; border-radius: 999px; background: var(--accent); animation: panda-studio-ease 1.4s infinite alternate; }
@keyframes panda-studio-ease { from { transform: translateX(0); } to { transform: translateX(130px); } }
.nav-label-spaced { margin-top: 20px; }
.tool { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
.tool-controls { display: flex; flex-direction: column; gap: 12px; }
.tool-controls label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: var(--muted); }
.tool-controls select, .tool-controls textarea { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--fg); font-size: 13px; font-family: inherit; }
.tool-controls select:focus, .tool-controls textarea:focus { outline: none; border-color: var(--accent); }
.contrast-preview { display: flex; align-items: center; justify-content: center; height: 160px; border: 1px solid var(--border); border-radius: 12px; font-size: 30px; font-weight: 600; }
.contrast-score { font-size: 40px; font-weight: 700; margin: 16px 0 12px; }
.badges { display: flex; flex-wrap: wrap; gap: 8px; }
.badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--border); }
.badge.pass { background: color-mix(in srgb, #16a34a 20%, transparent); border-color: #16a34a; }
.badge.fail { background: color-mix(in srgb, #dc2626 15%, transparent); border-color: #dc2626; opacity: 0.7; }
.semantic-sub { font-size: 12px; font-weight: 600; text-transform: capitalize; color: var(--fg); margin: 20px 0 10px; }
.semantic-sub:first-child { margin-top: 0; }
.semantic { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; align-items: start; margin-bottom: 8px; }
.semantic-card { border: 1px solid var(--border); border-radius: 10px; background: var(--card); padding: 12px; }
.semantic-name { font-size: 12px; font-weight: 600; margin-bottom: 10px; }
.semantic-conds { display: flex; flex-direction: column; gap: 8px; }
.semantic-cond { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.semantic-cond .sw { width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0; }
.semantic-cond .label { font-weight: 600; min-width: 90px; }
.semantic-cond .cv { color: var(--muted); font-family: ui-monospace, monospace; word-break: break-all; }
.type-play { display: flex; flex-direction: column; gap: 12px; }
.type-play-preview { display: flex; align-items: center; border: 1px solid var(--border); border-radius: 12px; background: var(--card); padding: 32px; min-height: 200px; overflow-wrap: anywhere; }
.type-play-css { border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; font-family: ui-monospace, monospace; font-size: 12px; color: var(--muted); line-height: 1.7; white-space: pre; overflow-x: auto; }
.tool-controls textarea { resize: vertical; min-height: 64px; }
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

const TYPE_CATEGORIES = new Set(${jsArray(TYPE_CATEGORIES)})
const SCALE_CATEGORIES = new Set(${jsArray(SCALE_CATEGORIES)})
const GRID_KIND = ${jsRecord(GRID_KIND)}
const SAMPLE = 'The quick brown fox jumps over the lazy dog'

function toPx(value) {
  const match = /^([\\d.]+)(rem|em|px)$/.exec(value)
  if (!match) return NaN
  return match[2] === 'px' ? parseFloat(match[1]) : parseFloat(match[1]) * 16
}

function scaleWidth(px, min, max) {
  if (px <= 0) return 0
  if (max <= min) return 100
  return ((Math.log(px) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 98 + 2
}

function renderScaleWithSort(container, items) {
  const control = document.createElement('div')
  control.className = 'sort-control'
  const label = document.createElement('label')
  label.textContent = 'Sort'
  const select = document.createElement('select')
  select.innerHTML =
    '<option value="asc">Ascending</option><option value="desc">Descending</option><option value="token">Token order</option>'
  label.appendChild(select)
  control.appendChild(label)
  const scaleBody = document.createElement('div')
  const draw = () => {
    scaleBody.textContent = ''
    renderScale(scaleBody, items, select.value)
  }
  select.addEventListener('change', draw)
  draw()
  container.append(control, scaleBody)
}

function renderScale(container, tokens, sort) {
  const rows = tokens
    .filter((token) => !token.name.includes('breakpoint-') && !Number.isNaN(toPx(token.value)))
    .map((token) => ({ token, px: toPx(token.value) }))
  if (rows.length === 0) return

  const byPx = rows.slice().sort((a, b) => a.px - b.px)
  const maxPx = byPx[byPx.length - 1].px || 1
  const minPx = byPx.find((row) => row.px > 0)?.px ?? maxPx
  const ordered = sort === 'token' ? rows : sort === 'desc' ? byPx.slice().reverse() : byPx
  const scale = document.createElement('div')
  scale.className = 'scale'
  for (const { token, px } of ordered) {
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
    bar.style.width = scaleWidth(px, minPx, maxPx) + '%'
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

  if (kind === 'shadow') {
    wrap.className = 'preview preview-shadow'
    const pair = document.createElement('div')
    pair.className = 'shadow-pair'
    for (const mode of ['force-light', 'force-dark']) {
      const cell = document.createElement('div')
      cell.className = 'shadow-cell ' + mode
      const chip = document.createElement('div')
      chip.className = 'chip'
      chip.style.boxShadow = value
      cell.appendChild(chip)
      pair.appendChild(cell)
    }
    wrap.appendChild(pair)
    return wrap
  }
  if (kind === 'radius' || kind === 'border' || kind === 'blur') {
    const chip = document.createElement('div')
    chip.className = 'chip'
    if (kind === 'radius') { chip.style.background = 'var(--swatch)'; chip.style.borderRadius = value }
    if (kind === 'border') chip.style.border = value
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
  if (kind === 'easing' || kind === 'duration') {
    const track = document.createElement('div')
    track.className = 'ease-track'
    const dot = document.createElement('div')
    dot.className = 'ease-dot'
    if (kind === 'easing') dot.style.animationTimingFunction = value
    else { dot.style.animationDuration = value; dot.style.animationTimingFunction = 'linear' }
    track.appendChild(dot)
    wrap.appendChild(track)
    return wrap
  }
  const chip = document.createElement('div')
  chip.style.height = '64px'
  chip.style.aspectRatio = value
  chip.style.maxWidth = '100%'
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

function matchesTerm(token, term) {
  return (token.name + ' ' + token.value + ' ' + token.category).toLowerCase().includes(term)
}

function renderView(tokens, view, query) {
  const grid = document.getElementById('grid')
  const tools = document.getElementById('tools')
  const count = document.getElementById('count')
  grid.textContent = ''
  tools.textContent = ''

  if (view === 'contrast') {
    count.textContent = ''
    renderContrast(tools, tokens.filter((token) => token.category === 'colors'))
    return
  }
  if (view === 'typography') {
    count.textContent = ''
    renderTypographyPlayground(tools, tokens)
    return
  }

  const term = query.trim().toLowerCase()

  if (view === 'semantic') {
    let items = tokens.filter((token) => token.conditions)
    if (term) items = items.filter((token) => matchesTerm(token, term))
    count.textContent = items.length + ' tokens'
    const section = document.createElement('section')
    const heading = document.createElement('h2')
    heading.textContent = 'semantic tokens'
    const body = document.createElement('div')
    renderSemantic(body, items)
    section.append(heading, body)
    grid.appendChild(section)
    return
  }

  let items = tokens.filter((token) => !token.conditions && token.category === view)
  if (term) items = items.filter((token) => matchesTerm(token, term))
  count.textContent = items.length + ' tokens'
  const section = document.createElement('section')
  const heading = document.createElement('h2')
  heading.textContent = view
  const body = document.createElement('div')
  if (view === 'colors') renderColors(body, items)
  else if (TYPE_CATEGORIES.has(view)) renderType(body, view, items)
  else if (SCALE_CATEGORIES.has(view)) renderScaleWithSort(body, items)
  else {
    body.className = 'grid'
    for (const token of items) body.appendChild(makeCard(token))
  }
  section.append(heading, body)
  grid.appendChild(section)
}

function renderSemantic(container, tokens) {
  const byCategory = new Map()
  for (const token of tokens) {
    if (!byCategory.has(token.category)) byCategory.set(token.category, [])
    byCategory.get(token.category).push(token)
  }
  const multi = byCategory.size > 1
  for (const [category, group] of byCategory) {
    if (multi) {
      const sub = document.createElement('h3')
      sub.className = 'semantic-sub'
      sub.textContent = category
      container.appendChild(sub)
    }
    const grid = document.createElement('div')
    grid.className = 'semantic'
    for (const token of group) {
      const card = document.createElement('div')
      card.className = 'semantic-card'
      const name = document.createElement('div')
      name.className = 'semantic-name'
      name.textContent = token.name
      const conds = document.createElement('div')
      conds.className = 'semantic-conds'
      for (const [label, value] of Object.entries(token.conditions)) {
        const row = document.createElement('div')
        row.className = 'semantic-cond'
        const labelEl = document.createElement('span')
        labelEl.className = 'label'
        labelEl.textContent = label
        const valueEl = document.createElement('span')
        valueEl.className = 'cv'
        valueEl.textContent = value
        if (category === 'colors') {
          const swatch = document.createElement('div')
          swatch.className = 'sw'
          swatch.style.background = value
          row.append(swatch, labelEl, valueEl)
        } else {
          row.append(labelEl, valueEl)
        }
        conds.appendChild(row)
      }
      card.append(name, conds)
      grid.appendChild(card)
    }
    container.appendChild(grid)
  }
}

function buildNav(views, current) {
  const tokenList = document.getElementById('nav')
  const playList = document.getElementById('nav-play')
  let hasPlayground = false
  views.forEach((view, index) => {
    const item = document.createElement('li')
    const link = document.createElement('a')
    link.href = index === 0 ? 'index.html' : view.id + '.html'
    link.textContent = view.label
    if (view.id === current) link.classList.add('active')
    item.appendChild(link)
    if (view.group === 'playground') {
      playList.appendChild(item)
      hasPlayground = true
    } else {
      tokenList.appendChild(item)
    }
  })
  if (!hasPlayground) document.getElementById('nav-play-label').style.display = 'none'
}

function buildBreadcrumb(views, current) {
  const crumb = document.getElementById('crumb')
  const view = views.find((item) => item.id === current)
  if (!view) return
  const group = document.createElement('span')
  group.textContent = view.group === 'playground' ? 'Playground' : 'Tokens'
  const sep = document.createElement('span')
  sep.className = 'sep'
  sep.textContent = '/'
  const here = document.createElement('span')
  here.className = 'here'
  here.textContent = view.label
  crumb.append(group, sep, here)
}

function toRgb(value) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(fg, bg) {
  const a = luminance(toRgb(fg))
  const b = luminance(toRgb(bg))
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

function badge(label, pass) {
  const el = document.createElement('span')
  el.className = 'badge ' + (pass ? 'pass' : 'fail')
  el.textContent = (pass ? '✓ ' : '✗ ') + label
  return el
}

function renderContrast(container, colors) {
  if (colors.length === 0) return

  const section = document.createElement('section')
  section.id = 'tool-contrast'
  section.dataset.cat = 'tool-contrast'
  const heading = document.createElement('h2')
  heading.textContent = 'contrast'

  const tool = document.createElement('div')
  tool.className = 'tool'

  const controls = document.createElement('div')
  controls.className = 'tool-controls'
  const options = colors.map((token) => '<option value="' + token.value + '">' + token.name + '</option>').join('')
  controls.innerHTML =
    '<label>Foreground<select id="contrast-fg">' + options + '</select></label>' +
    '<label>Background<select id="contrast-bg">' + options + '</select></label>'

  const result = document.createElement('div')
  const preview = document.createElement('div')
  preview.className = 'contrast-preview'
  preview.textContent = 'Aa'
  const score = document.createElement('div')
  score.className = 'contrast-score'
  const badges = document.createElement('div')
  badges.className = 'badges'
  result.append(preview, score, badges)

  tool.append(controls, result)
  section.append(heading, tool)
  container.appendChild(section)

  const fg = controls.querySelector('#contrast-fg')
  const bg = controls.querySelector('#contrast-bg')
  const dark = colors.find((token) => luminance(toRgb(token.value)) < 0.2)
  const light = colors.find((token) => luminance(toRgb(token.value)) > 0.8)
  if (dark) fg.value = dark.value
  if (light) bg.value = light.value

  function update() {
    const ratio = contrastRatio(fg.value, bg.value)
    preview.style.color = fg.value
    preview.style.background = bg.value
    score.textContent = ratio.toFixed(2) + ' : 1'
    badges.textContent = ''
    badges.append(
      badge('AA', ratio >= 4.5),
      badge('AA Large', ratio >= 3),
      badge('AAA', ratio >= 7),
      badge('AAA Large', ratio >= 4.5),
    )
  }
  fg.addEventListener('change', update)
  bg.addEventListener('change', update)
  update()
}

function optionsFor(tokens, category) {
  return tokens
    .filter((token) => token.category === category)
    .map((token) => '<option value="' + token.value + '">' + token.name + ' (' + token.value + ')</option>')
    .join('')
}

function renderTypographyPlayground(container, tokens) {
  const fields = [
    { prop: 'font-size', category: 'fontSizes', label: 'Font size' },
    { prop: 'font-weight', category: 'fontWeights', label: 'Font weight' },
    { prop: 'font-family', category: 'fonts', label: 'Font family' },
    { prop: 'line-height', category: 'lineHeights', label: 'Line height' },
    { prop: 'letter-spacing', category: 'letterSpacings', label: 'Letter spacing' },
  ].filter((field) => tokens.some((token) => token.category === field.category))
  if (fields.length === 0) return

  const section = document.createElement('section')
  section.id = 'tool-typography'
  section.dataset.cat = 'tool-typography'
  const heading = document.createElement('h2')
  heading.textContent = 'typography'

  const tool = document.createElement('div')
  tool.className = 'tool'

  const controls = document.createElement('div')
  controls.className = 'tool-controls'
  controls.innerHTML =
    fields
      .map(
        (field) =>
          '<label>' + field.label + '<select data-prop="' + field.prop + '">' + optionsFor(tokens, field.category) + '</select></label>',
      )
      .join('') + '<label>Sample text<textarea id="type-play-text">The quick brown fox jumps over the lazy dog</textarea></label>'

  const output = document.createElement('div')
  output.className = 'type-play'
  const preview = document.createElement('div')
  preview.className = 'type-play-preview'
  const cssOut = document.createElement('div')
  cssOut.className = 'type-play-css'
  output.append(preview, cssOut)

  tool.append(controls, output)
  section.append(heading, tool)
  container.appendChild(section)

  const selects = [...controls.querySelectorAll('select')]
  const text = controls.querySelector('#type-play-text')
  function update() {
    for (const select of selects) preview.style.setProperty(select.dataset.prop, select.value)
    preview.textContent = text.value
    cssOut.textContent = selects.map((select) => select.dataset.prop + ': ' + select.value + ';').join('\\n')
  }
  for (const select of selects) select.addEventListener('change', update)
  text.addEventListener('input', update)
  update()
}

function persistQuery(query) {
  const url = new URL(location.href)
  if (query) url.searchParams.set('q', query)
  else url.searchParams.delete('q')
  history.replaceState(null, '', url)
}

fetch('tokens.json').then((res) => res.json()).then((tokens) => {
  const views = JSON.parse(document.getElementById('views').textContent)
  const current = document.body.dataset.view
  buildNav(views, current)
  buildBreadcrumb(views, current)
  const search = document.getElementById('search')
  search.value = new URLSearchParams(location.search).get('q') || ''
  search.addEventListener('input', () => {
    persistQuery(search.value)
    renderView(tokens, current, search.value)
  })
  renderView(tokens, current, search.value)
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

const SHARED_HELPERS = `const TYPE_CATEGORIES = new Set(${jsArray(TYPE_CATEGORIES)})
const SCALE_CATEGORIES = new Set(${jsArray(SCALE_CATEGORIES)})
const GRID_KIND: Record<string, string> = ${jsRecord(GRID_KIND)}
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

function scaleWidth(px: number, min: number, max: number) {
  if (px <= 0) return 0
  if (max <= min) return 100
  return ((Math.log(px) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 98 + 2
}

function scaleRows(items: StudioToken[]) {
  const rows = items
    .filter((token) => !token.name.includes('breakpoint-') && !Number.isNaN(toPx(token.value)))
    .map((token) => ({ token, px: toPx(token.value) }))
    .sort((a, b) => a.px - b.px)
  const maxPx = rows.length ? rows[rows.length - 1].px || 1 : 1
  const minPx = rows.find((row) => row.px > 0)?.px ?? maxPx
  return rows.map((row) => ({ ...row, width: scaleWidth(row.px, minPx, maxPx) }))
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
  conditions?: Record<string, string>
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
      <style>{CSS}</style>
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
  conditions?: Record<string, string>
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
          <style>{CSS}</style>
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
