<script lang="ts">
  import { css, cva } from '#styled-system/css'
  import { button } from '$lib/button'

  const badge = cva({
    base: { px: '2', rounded: 'full', fontSize: 'sm' },
    variants: { tone: { info: { bg: 'blue.100', color: 'blue.800' } } },
  })
</script>

<main class={css({ p: '10', display: 'flex', flexDir: 'column', gap: '4', maxW: 'md' })}>
  <h1 class={css({ fontSize: '3xl', fontWeight: 'bold', color: 'green.600' })}>Svelte transform</h1>
  <span class={badge({ tone: 'info' })}>cva in .svelte</span>
  <button class={button({ tone: 'danger' })}>cva from .ts</button>
</main>
