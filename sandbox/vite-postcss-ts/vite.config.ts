import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// No @pandacss/vite plugin here — styles come through PostCSS (@pandacss/dev/postcss).
export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ['source'],
  },
})
