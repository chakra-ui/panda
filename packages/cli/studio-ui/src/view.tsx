import { matchesTerm, SCALE_CATEGORIES, type StudioToken, TYPE_CATEGORIES } from './helpers'
import { Card, Palette, Scale, Semantic, ShadowCard, TypeList } from './sections'
import { Showcase } from './showcase'
import { Contrast, TypographyPlayground } from './tools'

export function ViewContent({
  view,
  tokens,
  query,
  theme,
}: {
  view: string
  tokens: StudioToken[]
  query: string
  theme: string
}) {
  const term = query.trim().toLowerCase()

  switch (view) {
    case 'contrast':
      return <Contrast colors={tokens.filter((t) => t.category === 'colors')} />

    case 'typography':
      return <TypographyPlayground tokens={tokens} />

    case 'playground':
      return (
        <section>
          <h2>playground</h2>
          <Showcase tokens={tokens} theme={theme} />
        </section>
      )

    case 'semantic': {
      const items = tokens.filter((t) => t.conditions).filter((t) => !term || matchesTerm(t, term))
      return (
        <section>
          <h2>semantic tokens</h2>
          <Semantic items={items} />
        </section>
      )
    }

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
  if (view === 'contrast' || view === 'typography' || view === 'playground') return null
  const term = query.trim().toLowerCase()
  const items =
    view === 'semantic'
      ? tokens.filter((t) => t.conditions)
      : tokens.filter((t) => !t.conditions && t.category === view)
  return items.filter((t) => !term || matchesTerm(t, term)).length
}
