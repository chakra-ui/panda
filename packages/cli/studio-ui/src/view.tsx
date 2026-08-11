import { matchesTerm, SCALE_CATEGORIES, type StudioToken, TYPE_CATEGORIES } from './helpers'
import { Card, Palette, Scale, Semantic, ShadowCard, TypeList } from './sections'
import { Contrast, TypographyPlayground } from './tools'

export function ViewContent({ view, tokens, query }: { view: string; tokens: StudioToken[]; query: string }) {
  const term = query.trim().toLowerCase()

  if (view.startsWith('semantic-')) {
    const category = view.slice('semantic-'.length)
    const items = tokens
      .filter((t) => t.conditions && t.category === category)
      .filter((t) => !term || matchesTerm(t, term))
    return (
      <section>
        <h2>{category}</h2>
        <Semantic items={items} />
      </section>
    )
  }

  switch (view) {
    case 'contrast':
      return <Contrast colors={tokens.filter((t) => t.category === 'colors')} />

    case 'typography':
      return <TypographyPlayground tokens={tokens} />

    default: {
      const items = tokens
        .filter((t) => !t.conditions && t.category === view)
        .filter((t) => !term || matchesTerm(t, term))
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
  }
}

export function countFor(view: string, tokens: StudioToken[], query: string): number | null {
  if (view === 'contrast' || view === 'typography') return null
  const term = query.trim().toLowerCase()
  const items = view.startsWith('semantic-')
    ? tokens.filter((t) => t.conditions && t.category === view.slice('semantic-'.length))
    : tokens.filter((t) => !t.conditions && t.category === view)
  return items.filter((t) => !term || matchesTerm(t, term)).length
}
