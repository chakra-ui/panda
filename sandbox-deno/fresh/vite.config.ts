import { defineConfig } from 'vite'
import { fresh } from '@fresh/plugin-vite'
import panda from '@pandacss/vite'
import type { PluginOption } from 'vite'

export default defineConfig({
  plugins: [fresh({ serverEntry: 'main.tsx' }), panda() as PluginOption],
})
