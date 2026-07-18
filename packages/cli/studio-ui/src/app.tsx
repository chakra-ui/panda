import { useMemo, useState } from 'preact/hooks'
import { matchesTerm, type StudioToken, type StudioView } from './helpers'
import { PandaMark, Semantic } from './sections'
import { countFor, ViewContent } from './view'

interface AppProps {
  tokens: StudioToken[]
  views: StudioView[]
  current: string
  logo: string
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
