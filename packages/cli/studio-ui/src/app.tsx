import { useMemo, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import {
  byShade,
  contrastRatio,
  GRID_KIND,
  groupFamilies,
  luminance,
  matchesTerm,
  SAMPLE,
  SCALE_CATEGORIES,
  scaleRows,
  shadeOf,
  type StudioToken,
  type StudioView,
  toPx,
  TYPE_CATEGORIES,
  typeStyle,
} from './helpers'

interface AppProps {
  tokens: StudioToken[]
  views: StudioView[]
  current: string
  logo: string
}

function PandaMark() {
  return (
    <svg class="logo" viewBox="0 0 15 15" width={20} height={20} fill="currentColor">
      <path d="M10.7608 0.390669C9.38613 -0.0126127 7.98396 -0.067426 6.55506 0.0630881C5.75542 0.147945 4.98667 0.310054 4.24518 0.594509C2.64244 1.20936 1.43903 2.27424 0.72147 3.87754C0.207033 5.02698 0.0211109 6.24802 0.0017347 7.50081C-0.0187424 8.8248 0.143717 10.1305 0.401862 11.4249C0.635852 12.5983 0.947463 13.7487 1.39249 14.8591C1.43477 14.9646 1.48743 15.0002 1.60028 15C3.0078 14.9969 4.41533 14.9969 5.82286 14.9969C6.23955 14.9969 6.65623 14.9969 7.07292 14.9968C7.10483 14.9968 7.13673 14.995 7.17342 14.993C7.19215 14.9919 7.21213 14.9908 7.23399 14.9898C7.22553 14.9693 7.21796 14.9504 7.21087 14.9327C7.19692 14.8979 7.18479 14.8676 7.17125 14.838C7.06947 14.6156 6.96558 14.3942 6.86169 14.1728C6.63635 13.6924 6.41101 13.2121 6.20721 12.7224C5.5891 11.2373 5.11575 9.7082 4.9713 8.08959C4.90756 7.37541 4.91641 6.66531 5.11044 5.96941C5.33222 5.17396 5.80814 4.6124 6.59715 4.37763C7.32168 4.16204 8.05629 4.16346 8.77688 4.40144C9.42 4.61383 9.8393 5.06248 10.0176 5.73423C10.1546 6.25013 10.1546 6.77159 10.051 7.29169C9.97115 7.69214 9.81051 8.05756 9.52137 8.34988C9.00271 8.87423 8.35495 8.9948 7.6599 8.95462C7.53624 8.94747 7.41295 8.93362 7.28592 8.91936C7.22642 8.91267 7.16609 8.9059 7.10452 8.89968C7.10629 8.91977 7.10727 8.93828 7.10819 8.95562C7.10999 8.98973 7.11156 9.01931 7.11843 9.04755C7.14805 9.16913 7.17627 9.29115 7.2045 9.41319C7.27249 9.70715 7.3405 10.0012 7.42793 10.289C7.59961 10.8542 7.79925 11.4058 8.02556 11.9443C9.63883 11.8158 11.1248 11.4062 12.7019 10.4393C12.7256 10.4241 12.7471 10.4103 12.7686 10.3966C13.4461 9.96587 13.9944 9.40712 14.3725 8.68563C14.9848 7.51725 15.1042 6.26777 14.9223 4.97808C14.7345 3.64712 14.1497 2.52993 13.1429 1.6536C12.4446 1.0458 11.6371 0.647746 10.7608 0.390669Z" />
    </svg>
  )
}

function GridPreview({ category, value }: { category: string; value: string }) {
  const kind = GRID_KIND[category]
  if (kind === 'radius') return <div class="chip" style={{ background: 'var(--swatch)', borderRadius: value }} />
  if (kind === 'border') return <div class="chip" style={{ border: value }} />
  if (kind === 'blur')
    return (
      <div
        class="chip"
        style={{ background: 'linear-gradient(135deg, var(--accent), #ec4899)', filter: `blur(${value})` }}
      />
    )
  if (kind === 'ratio')
    return (
      <div style={{ height: 64, aspectRatio: value, maxWidth: '100%', background: 'var(--swatch)', borderRadius: 6 }} />
    )
  if (kind === 'animation') return <div class="anim-box" style={{ animation: value }} />
  if (kind === 'easing')
    return (
      <div class="ease-track">
        <div class="ease-dot" style={{ animationTimingFunction: value }} />
      </div>
    )
  if (kind === 'duration')
    return (
      <div class="ease-track">
        <div class="ease-dot" style={{ animationDuration: value, animationTimingFunction: 'linear' }} />
      </div>
    )
  return null
}

function Card({ token }: { token: StudioToken }) {
  return (
    <div class="card">
      <div class="preview">
        <GridPreview category={token.category} value={token.value} />
      </div>
      <div class="name">{token.name}</div>
      <div class="value">{token.value}</div>
    </div>
  )
}

function ShadowCard({ token }: { token: StudioToken }) {
  return (
    <div class="card">
      <div class="preview preview-shadow">
        <div class="shadow-pair">
          <div class="shadow-cell force-light">
            <div class="chip" style={{ boxShadow: token.value }} />
          </div>
          <div class="shadow-cell force-dark">
            <div class="chip" style={{ boxShadow: token.value }} />
          </div>
        </div>
      </div>
      <div class="name">{token.name}</div>
      <div class="value">{token.value}</div>
    </div>
  )
}

function Palette({ items }: { items: StudioToken[] }) {
  return (
    <>
      {groupFamilies(items).map(([family, shades]) => (
        <div class="palette" key={family}>
          <div class="palette-name">{family}</div>
          <div class="shades">
            {shades
              .slice()
              .sort(byShade)
              .map((token) => (
                <div key={token.path}>
                  <div class="shade-chip" style={{ background: token.value }} title={token.value} />
                  <div class="shade-name">{shadeOf(token.name)}</div>
                  <div class="shade-value">{token.value}</div>
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
    <div class="type-list">
      {items.map((token) => (
        <div key={token.path}>
          <div class="type-meta">
            <span class="type-name">{token.name}</span>
            <span class="type-value">{token.value}</span>
          </div>
          <div class="type-sample" style={typeStyle(category, token.value)}>
            {category === 'lineHeights' ? `${SAMPLE}. ${SAMPLE}.` : SAMPLE}
          </div>
        </div>
      ))}
    </div>
  )
}

function Scale({ items }: { items: StudioToken[] }) {
  const [sort, setSort] = useState<'asc' | 'desc' | 'token'>('asc')
  return (
    <>
      <div class="sort-control">
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort((e.currentTarget as HTMLSelectElement).value as typeof sort)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
            <option value="token">Token order</option>
          </select>
        </label>
      </div>
      <div class="scale">
        {scaleRows(items, sort).map(({ token, px, width }) => (
          <>
            <div class="s-name">{token.name}</div>
            <div class="s-value">{token.value}</div>
            <div class="s-px">{Math.round(px)}px</div>
            <div class="s-track">
              <div class="s-bar" style={{ width: `${width}%` }} />
            </div>
          </>
        ))}
      </div>
    </>
  )
}

function Semantic({ items }: { items: StudioToken[] }) {
  const byCategory = new Map<string, StudioToken[]>()
  for (const token of items) {
    if (!byCategory.has(token.category)) byCategory.set(token.category, [])
    byCategory.get(token.category)!.push(token)
  }
  const multi = byCategory.size > 1
  return (
    <>
      {[...byCategory.entries()].map(([category, group]) => (
        <>
          {multi && <h3 class="semantic-sub">{category}</h3>}
          {category === 'colors' ? (
            group.map((token) => (
              <div class="palette" key={token.path}>
                <div class="palette-name">{token.name}</div>
                <div class="shades">
                  {Object.entries(token.conditions ?? {}).map(([label, value]) => (
                    <div key={label}>
                      <div class="shade-chip" style={{ background: value }} title={value} />
                      <div class="shade-name">{label}</div>
                      <div class="shade-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div class="semantic">
              {group.map((token) => (
                <div class="semantic-card" key={token.path}>
                  <div class="semantic-name">{token.name}</div>
                  <div class="semantic-conds">
                    {Object.entries(token.conditions ?? {}).map(([label, value]) => (
                      <div class="semantic-cond" key={label}>
                        <span class="label">{label}</span>
                        <span class="cv">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ))}
    </>
  )
}

function badge(label: string, pass: boolean) {
  return (
    <span class={`badge ${pass ? 'pass' : 'fail'}`}>
      {pass ? '✓ ' : '✗ '}
      {label}
    </span>
  )
}

function Contrast({ colors }: { colors: StudioToken[] }) {
  const dark = colors.find((token) => luminance(token.value) < 0.2)
  const light = colors.find((token) => luminance(token.value) > 0.8)
  const [fg, setFg] = useState((dark ?? colors[0])?.value)
  const [bg, setBg] = useState((light ?? colors[colors.length - 1])?.value)
  const ratio = contrastRatio(fg, bg)
  const options = colors.map((token) => (
    <option value={token.value} key={token.path}>
      {token.name}
    </option>
  ))
  return (
    <section>
      <h2>contrast</h2>
      <div class="tool">
        <div class="tool-controls">
          <label>
            Foreground
            <select value={fg} onChange={(e) => setFg((e.currentTarget as HTMLSelectElement).value)}>
              {options}
            </select>
          </label>
          <label>
            Background
            <select value={bg} onChange={(e) => setBg((e.currentTarget as HTMLSelectElement).value)}>
              {options}
            </select>
          </label>
        </div>
        <div>
          <div class="contrast-preview" style={{ color: fg, background: bg }}>
            Aa
          </div>
          <div class="contrast-score">{ratio.toFixed(2)} : 1</div>
          <div class="badges">
            {badge('AA', ratio >= 4.5)}
            {badge('AA Large', ratio >= 3)}
            {badge('AAA', ratio >= 7)}
            {badge('AAA Large', ratio >= 4.5)}
          </div>
        </div>
      </div>
    </section>
  )
}

const TYPO_FIELDS = [
  { prop: 'fontSize', css: 'font-size', category: 'fontSizes', label: 'Font size' },
  { prop: 'fontWeight', css: 'font-weight', category: 'fontWeights', label: 'Font weight' },
  { prop: 'fontFamily', css: 'font-family', category: 'fonts', label: 'Font family' },
  { prop: 'lineHeight', css: 'line-height', category: 'lineHeights', label: 'Line height' },
  { prop: 'letterSpacing', css: 'letter-spacing', category: 'letterSpacings', label: 'Letter spacing' },
] as const

function TypographyPlayground({ tokens }: { tokens: StudioToken[] }) {
  const fields = TYPO_FIELDS.filter((field) => tokens.some((token) => token.category === field.category))
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const field of fields) initial[field.prop] = tokens.find((token) => token.category === field.category)!.value
    return initial
  })
  const [text, setText] = useState(SAMPLE)
  const style = Object.fromEntries(fields.map((field) => [field.prop, values[field.prop]])) as JSX.CSSProperties
  const css = fields.map((field) => `${field.css}: ${values[field.prop]};`).join('\n')
  return (
    <section>
      <h2>typography</h2>
      <div class="tool">
        <div class="tool-controls">
          {fields.map((field) => (
            <label key={field.prop}>
              {field.label}
              <select
                value={values[field.prop]}
                onChange={(e) => setValues({ ...values, [field.prop]: (e.currentTarget as HTMLSelectElement).value })}
              >
                {tokens
                  .filter((token) => token.category === field.category)
                  .map((token) => (
                    <option value={token.value} key={token.path}>
                      {token.name} ({token.value})
                    </option>
                  ))}
              </select>
            </label>
          ))}
          <label>
            Sample text
            <textarea value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} />
          </label>
        </div>
        <div class="type-play">
          <div class="type-play-preview" style={style}>
            {text}
          </div>
          <div class="type-play-css">{css}</div>
        </div>
      </div>
    </section>
  )
}

const PG_HTML = `<div class="card">
  <span class="tag">Panda</span>
  <h1>Design tokens, live</h1>
  <p>Edit the HTML and CSS. Every token in your config is a CSS variable, e.g. var(--colors-accent).</p>
  <button>Get started</button>
</div>`

const PG_CSS = `.card {
  max-width: 380px;
  padding: var(--spacing-6, 24px);
  border-radius: var(--radii-xl, 16px);
  background: var(--colors-bg, #fff);
  color: var(--colors-text, #111);
  box-shadow: var(--shadows-lg, 0 10px 30px rgba(0, 0, 0, 0.12));
}
.tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--colors-accent, #f6e458);
  color: #1a1a1a;
}
h1 { font-size: var(--fontSizes-2xl, 1.6rem); margin: 14px 0 6px; }
p { color: var(--colors-muted, #667085); line-height: 1.6; }
button {
  margin-top: 16px;
  border: 0;
  padding: 10px 18px;
  border-radius: var(--radii-md, 8px);
  background: var(--colors-accent, #f6e458);
  font-weight: 600;
  cursor: pointer;
}`

function Playground({ tokens }: { tokens: StudioToken[] }) {
  const vars = tokens.map((token) => `  --${token.path.replace(/\./g, '-')}: ${token.value};`).join('\n')
  const [html, setHtml] = useState(PG_HTML)
  const [css, setCss] = useState(PG_CSS)
  const srcdoc = `<!doctype html><html><head><meta charset="utf-8" /><style>
:root {
${vars}
}
* { box-sizing: border-box; }
body { margin: 0; padding: 28px; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; }
${css}
</style></head><body>
${html}
</body></html>`

  return (
    <section>
      <h2>playground</h2>
      <div class="pg-editor">
        <div class="pg-panes">
          <label class="pg-pane">
            <span>HTML</span>
            <textarea
              spellcheck={false}
              value={html}
              onInput={(e) => setHtml((e.currentTarget as HTMLTextAreaElement).value)}
            />
          </label>
          <label class="pg-pane">
            <span>CSS</span>
            <textarea
              spellcheck={false}
              value={css}
              onInput={(e) => setCss((e.currentTarget as HTMLTextAreaElement).value)}
            />
          </label>
        </div>
        <iframe class="pg-frame" title="Playground preview" srcdoc={srcdoc} />
      </div>
    </section>
  )
}

function ViewContent({ view, tokens, query }: { view: string; tokens: StudioToken[]; query: string }) {
  const term = query.trim().toLowerCase()
  if (view === 'contrast') return <Contrast colors={tokens.filter((t) => t.category === 'colors')} />
  if (view === 'typography') return <TypographyPlayground tokens={tokens} />
  if (view === 'playground') return <Playground tokens={tokens} />

  if (view === 'semantic') {
    const items = tokens.filter((t) => t.conditions).filter((t) => !term || matchesTerm(t, term))
    return (
      <section>
        <h2>semantic tokens</h2>
        <Semantic items={items} />
      </section>
    )
  }

  const items = tokens.filter((t) => !t.conditions && t.category === view).filter((t) => !term || matchesTerm(t, term))
  return (
    <section>
      <h2>{view}</h2>
      {view === 'colors' ? (
        <Palette items={items} />
      ) : TYPE_CATEGORIES.has(view) ? (
        <TypeList category={view} items={items} />
      ) : SCALE_CATEGORIES.has(view) ? (
        <Scale items={items} />
      ) : view === 'shadows' ? (
        <div class="grid">
          {items.map((token) => (
            <ShadowCard token={token} key={token.path} />
          ))}
        </div>
      ) : (
        <div class="grid">
          {items.map((token) => (
            <Card token={token} key={token.path} />
          ))}
        </div>
      )}
    </section>
  )
}

function countFor(view: string, tokens: StudioToken[], query: string): number | null {
  if (view === 'contrast' || view === 'typography' || view === 'playground') return null
  const term = query.trim().toLowerCase()
  const items =
    view === 'semantic'
      ? tokens.filter((t) => t.conditions)
      : tokens.filter((t) => !t.conditions && t.category === view)
  return items.filter((t) => !term || matchesTerm(t, term)).length
}

export function App({ tokens, views, current, logo }: AppProps) {
  const [query, setQuery] = useState(new URLSearchParams(location.search).get('q') ?? '')
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') ?? '')

  const semanticCats = useMemo(() => {
    const cats: string[] = []
    for (const token of tokens) if (token.conditions && !cats.includes(token.category)) cats.push(token.category)
    return cats
  }, [tokens])
  const [semCat, setSemCat] = useState(semanticCats[0] ?? '')

  const activeTheme = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const view = views.find((v) => v.id === current)
  const inSemantic = current === 'semantic'
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  const href = (id: string) => (views[0]?.id === id ? 'index.html' : `${id}.html`) + suffix
  const term = query.trim().toLowerCase()

  const onSearch = (value: string) => {
    setQuery(value)
    const url = new URL(location.href)
    if (value) url.searchParams.set('q', value)
    else url.searchParams.delete('q')
    history.replaceState(null, '', url)
  }

  const toggleTheme = () => {
    const next = activeTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('panda-studio-theme', next)
    setTheme(next)
  }

  const tokenViews = views.filter((v) => v.group === 'tokens')
  const semanticViews = views.filter((v) => v.group === 'semantic')
  const playViews = views.filter((v) => v.group === 'playground')
  const semItems = tokens.filter((t) => t.conditions && t.category === semCat && (!term || matchesTerm(t, term)))
  const count = countFor(current, tokens, query)

  const navList = (items: StudioView[]) => (
    <ul>
      {items.map((v) => (
        <li key={v.id}>
          <a class={v.id === current ? 'active' : ''} href={href(v.id)}>
            {v.label}
          </a>
        </li>
      ))}
    </ul>
  )

  const searchBox = (
    <div class="search-wrap content-search">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        width={15}
        height={15}
        fill="none"
        stroke="currentColor"
        stroke-width={2}
        stroke-linecap="round"
      >
        <circle cx={11} cy={11} r={7} />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        class="search"
        type="search"
        placeholder="Filter tokens…"
        aria-label="Filter tokens"
        value={query}
        onInput={(e) => onSearch((e.currentTarget as HTMLInputElement).value)}
      />
    </div>
  )

  return (
    <div class="app">
      <aside class="sidebar">
        <div class="brand">
          {logo ? <img class="logo logo-custom" src={logo} alt="logo" /> : <PandaMark />} Panda Studio
        </div>
        {inSemantic ? (
          <nav class="nav">
            <a class="nav-back" href={href(views[0]?.id)}>
              ← All tokens
            </a>
            <div class="nav-label nav-label-spaced">Semantic</div>
            <ul>
              {semanticCats.map((cat) => (
                <li key={cat}>
                  <a
                    class={cat === semCat ? 'active' : ''}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setSemCat(cat)
                    }}
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <nav class="nav">
            {semanticViews.length > 0 && (
              <>
                <div class="nav-label">Semantic</div>
                {navList(semanticViews)}
              </>
            )}
            <div class={semanticViews.length > 0 ? 'nav-label nav-label-spaced' : 'nav-label'}>Tokens</div>
            {navList(tokenViews)}
            {playViews.length > 0 && (
              <>
                <div class="nav-label nav-label-spaced">Playground</div>
                {navList(playViews)}
              </>
            )}
          </nav>
        )}
      </aside>
      <main class="content">
        {inSemantic ? (
          <>
            <div class="content-head">
              <nav class="crumb">
                <span>Semantic</span>
                <span class="sep">/</span>
                <span class="here">{semCat}</span>
              </nav>
              {searchBox}
              <span class="count">{semItems.length} tokens</span>
            </div>
            <section>
              <h2>{semCat}</h2>
              <Semantic items={semItems} />
            </section>
          </>
        ) : (
          <>
            <div class="content-head">
              <nav class="crumb">
                <span>{view?.group === 'playground' ? 'Playground' : 'Tokens'}</span>
                <span class="sep">/</span>
                <span class="here">{view?.label}</span>
              </nav>
              {count != null && searchBox}
              {count != null && <span class="count">{count} tokens</span>}
            </div>
            <ViewContent view={current} tokens={tokens} query={query} />
          </>
        )}
      </main>
      <button class="theme" type="button" aria-label="Toggle color theme" onClick={toggleTheme}>
        {activeTheme === 'dark' ? '☀' : '☾'}
      </button>
    </div>
  )
}
