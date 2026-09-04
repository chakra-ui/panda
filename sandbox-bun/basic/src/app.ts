import { css } from '../styled-system/css'
import { badge } from '../styled-system/recipes'

export const page = css({
  display: 'grid',
  minHeight: '100vh',
  placeItems: 'center',
  backgroundColor: 'brand.50',
  color: 'ink.900',
  padding: '24px',
})

export const card = css({
  display: 'grid',
  gap: '16px',
  padding: '32px',
  borderRadius: '24px',
  backgroundColor: 'white',
  color: 'brand.700',
})

export const tag = badge({ tone: 'brand' })

export function render(root: HTMLElement) {
  root.innerHTML = `
    <main class="${page}">
      <section class="${card}">
        <span class="${tag}">Bun + Panda</span>
        <h1>Hello from Bun</h1>
        <p>This page is bundled by Bun's dev server and styled by the Panda plugin.</p>
      </section>
    </main>`
}

if (typeof document !== 'undefined') render(document.body)
