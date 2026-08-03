import { useState } from 'preact/hooks'
import type { StudioToken, StudioView } from './helpers'
import { ContentHead, Sidebar, ThemeToggle } from './shell'
import { countFor, ViewContent } from './view'

interface AppProps {
  tokens: StudioToken[]
  views: StudioView[]
  current: string
  logo: string
}

function viewHref(views: StudioView[], id: string, query: string) {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  return (views[0]?.id === id ? 'index.html' : `${id}.html`) + suffix
}

function persistQuery(value: string) {
  const url = new URL(location.href)
  if (value) url.searchParams.set('q', value)
  else url.searchParams.delete('q')
  history.replaceState(null, '', url)
}

function nextTheme(active: string) {
  return active === 'dark' ? 'light' : 'dark'
}

export function App({ tokens, views, current, logo }: AppProps) {
  const [query, setQuery] = useState(new URLSearchParams(location.search).get('q') ?? '')
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') ?? '')

  const activeTheme = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const view = views.find((v) => v.id === current)
  const href = (id: string) => viewHref(views, id, query)

  const onSearch = (value: string) => {
    setQuery(value)
    persistQuery(value)
  }

  const toggleTheme = () => {
    const next = nextTheme(activeTheme)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('panda-studio-theme', next)
    setTheme(next)
  }

  const crumb = view?.group === 'semantic' ? 'Semantic tokens' : view?.group === 'playground' ? 'Playground' : 'Tokens'

  return (
    <div class="app">
      <Sidebar
        logo={logo}
        current={current}
        href={href}
        tokenViews={views.filter((v) => v.group === 'tokens')}
        semanticViews={views.filter((v) => v.group === 'semantic')}
        playViews={views.filter((v) => v.group === 'playground')}
      />
      <main class="content">
        <ContentHead
          group={crumb}
          here={view?.label}
          query={query}
          onSearch={onSearch}
          count={countFor(current, tokens, query)}
        />
        <ViewContent view={current} tokens={tokens} query={query} theme={activeTheme} />
      </main>
      <ThemeToggle theme={activeTheme} onToggle={toggleTheme} />
    </div>
  )
}
