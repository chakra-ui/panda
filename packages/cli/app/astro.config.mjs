import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { panda } from './vite-plugin.mjs'

// https://astro.build/config
export default defineConfig({
  outDir: process.env.ASTRO_OUT_DIR,
  integrations: [react(), panda],
})
