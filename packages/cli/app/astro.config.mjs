import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import virtualPanda from './virtual-panda.mjs'

// https://astro.build/config
export default defineConfig({
  outDir: process.env.ASTRO_OUT_DIR,
  integrations: [react(), virtualPanda()],
})
