import type { StudioView } from './helpers'
import { PandaMark } from './sections'

export function SearchBox({ value, onInput }: { value: string; onInput: (value: string) => void }) {
  return (
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
        value={value}
        onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
      />
    </div>
  )
}

export function NavList({
  items,
  current,
  href,
}: {
  items: StudioView[]
  current: string
  href: (id: string) => string
}) {
  return (
    <ul>
      {items.map((view) => (
        <li key={view.id}>
          <a class={view.id === current ? 'active' : ''} href={href(view.id)}>
            {view.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function ThemeToggle({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  return (
    <button class="theme" type="button" aria-label="Toggle color theme" onClick={onToggle}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

export function ContentHead({
  group,
  here,
  query,
  onSearch,
  count,
}: {
  group: string
  here?: string
  query: string
  onSearch: (value: string) => void
  count: number | null
}) {
  return (
    <div class="content-head">
      <nav class="crumb">
        <span>{group}</span>
        <span class="sep">/</span>
        <span class="here">{here}</span>
      </nav>
      {count != null && <SearchBox value={query} onInput={onSearch} />}
      {count != null && <span class="count">{count} tokens</span>}
    </div>
  )
}

interface SidebarProps {
  logo: string
  current: string
  href: (id: string) => string
  inSemantic: boolean
  backHref: string
  semanticCats: string[]
  semCat: string
  onSemCat: (cat: string) => void
  tokenViews: StudioView[]
  semanticViews: StudioView[]
  playViews: StudioView[]
}

export function Sidebar(props: SidebarProps) {
  const { logo, current, href, inSemantic, backHref, semanticCats, semCat, onSemCat } = props
  const { tokenViews, semanticViews, playViews } = props
  return (
    <aside class="sidebar">
      <div class="brand">
        {logo ? <img class="logo logo-custom" src={logo} alt="logo" /> : <PandaMark />} Panda Studio
      </div>
      {inSemantic ? (
        <nav class="nav">
          <a class="nav-back" href={backHref}>
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
                    onSemCat(cat)
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
              <NavList items={semanticViews} current={current} href={href} />
            </>
          )}
          <div class={semanticViews.length > 0 ? 'nav-label nav-label-spaced' : 'nav-label'}>Tokens</div>
          <NavList items={tokenViews} current={current} href={href} />
          {playViews.length > 0 && (
            <>
              <div class="nav-label nav-label-spaced">Playground</div>
              <NavList items={playViews} current={current} href={href} />
            </>
          )}
        </nav>
      )}
    </aside>
  )
}
