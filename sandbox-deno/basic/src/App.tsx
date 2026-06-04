import { css } from '../styled-system/css/css.ts'
import { badge } from '../styled-system/recipes/index.ts'

const page = css({
  display: 'grid',
  minHeight: '100vh',
  placeItems: 'center',
  backgroundColor: 'brand.50',
  color: 'ink.900',
  padding: '24px',
})

const card = css({
  display: 'grid',
  gap: '16px',
  padding: '32px',
  borderRadius: '24px',
  backgroundColor: 'white',
  color: 'brand.700',
})

export function App() {
  return (
    <main className={page}>
      <section className={card}>
        <span className={badge({ tone: 'brand' })}>Deno + React + Panda</span>
        <h1>Hello from React on Deno</h1>
        <p>This page is server-rendered by Deno and styled with generated Panda TS artifacts.</p>
      </section>
    </main>
  )
}
