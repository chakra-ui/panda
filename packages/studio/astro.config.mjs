import react from '@astrojs/react'
import panda from '@pandacss/astro-plugin-studio'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [react(), panda()],
})
