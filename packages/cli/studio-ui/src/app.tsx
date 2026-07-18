import { useMemo, useState } from 'preact/hooks'
import { matchesTerm, type StudioToken, type StudioView } from './helpers'
import { Semantic } from './sections'
import { ContentHead, Sidebar, ThemeToggle } from './shell'
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

  const semItems = tokens.filter((t) => t.conditions && t.category === semCat && (!term || matchesTerm(t, term)))

  return (
    <div class="app">
      <Sidebar
        logo={logo}
        current={current}
        href={href}
        inSemantic={inSemantic}
        backHref={href(views[0]?.id)}
        semanticCats={semanticCats}
        semCat={semCat}
        onSemCat={setSemCat}
        tokenViews={views.filter((v) => v.group === 'tokens')}
        semanticViews={views.filter((v) => v.group === 'semantic')}
        playViews={views.filter((v) => v.group === 'playground')}
      />
      <main class="content">
        {inSemantic ? (
          <>
            <ContentHead group="Semantic" here={semCat} query={query} onSearch={onSearch} count={semItems.length} />
            <section>
              <h2>{semCat}</h2>
              <Semantic items={semItems} />
            </section>
          </>
        ) : (
          <>
            <ContentHead
              group={view?.group === 'playground' ? 'Playground' : 'Tokens'}
              here={view?.label}
              query={query}
              onSearch={onSearch}
              count={countFor(current, tokens, query)}
            />
            <ViewContent view={current} tokens={tokens} query={query} theme={activeTheme} />
          </>
        )}
      </main>
      <ThemeToggle theme={activeTheme} onToggle={toggleTheme} />
    </div>
  )
}
