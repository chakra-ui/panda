import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  designSystem: '@sandbox/ds',
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        spacing: {
          4: { value: '1rem' },
          6: { value: '1.5rem' },
        },
      },
      recipes: {
        // App-only recipe: emitted locally as the overlay delta.
        panel: {
          className: 'panel',
          base: { display: 'flex', flexDirection: 'column', gap: '3', padding: '6' },
        },
        // Also declared by the design system: the app's definition merges over it (theme.extend),
        // and Panda warns. The DS `tag` is black; this makes it brand-colored so the merge is visible.
        tag: {
          className: 'tag',
          base: { color: 'black', backgroundColor: 'brand' },
        },
      },
    },
  },
})
