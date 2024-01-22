import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import eslint from 'vite-plugin-eslint'
const ANALYZE = !!process.env.ANALYZE

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint()],
  build: {
    sourcemap: ANALYZE,
  },
  resolve: {
    conditions: ['source'],
  },
})
