import studio from '@pandacss/astro-plugin-studio'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: true },
  integrations: [studio()],
})
