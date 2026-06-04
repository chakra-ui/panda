import { css } from '../styled-system/css/css.ts'
import { badge } from '../styled-system/recipes/index.ts'
import Counter from '../islands/Counter.tsx'

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

export default function Home() {
  return (
    <main class={page}>
      <section class={card}>
        <span class={badge({ tone: 'brand' })}>Fresh + Vite + Panda</span>
        <h1>Hello from Fresh on Deno</h1>
        <p>This page is rendered by a Fresh filesystem route and styled by Panda.</p>
        <Counter />
      </section>
    </main>
  )
}
