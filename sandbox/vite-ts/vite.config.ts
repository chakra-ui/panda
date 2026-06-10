import pandacss from '@pandacss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const ANALYZE = !!process.env.ANALYZE

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [pandacss(), react()],
  build: {
    sourcemap: ANALYZE,
  },
  resolve: {
    conditions: ['source'],
  },
})
