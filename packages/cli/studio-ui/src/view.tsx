import { matchesTerm, SCALE_CATEGORIES, type StudioToken, TYPE_CATEGORIES } from './helpers'
import { Card, Palette, Scale, Semantic, ShadowCard, TypeList } from './sections'
import { Contrast, Playground, TypographyPlayground } from './tools'

export function ViewContent({ view, tokens, query }: { view: string; tokens: StudioToken[]; query: string }) {
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

export function countFor(view: string, tokens: StudioToken[], query: string): number | null {
  if (view === 'contrast' || view === 'typography' || view === 'playground') return null
  const term = query.trim().toLowerCase()
  const items =
    view === 'semantic'
      ? tokens.filter((t) => t.conditions)
      : tokens.filter((t) => !t.conditions && t.category === view)
  return items.filter((t) => !term || matchesTerm(t, term)).length
}
