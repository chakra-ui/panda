import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Pages from 'vite-plugin-pages'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), Pages()],
  resolve: {
    alias: {
      'design-system': path.resolve(__dirname, './design-system'),
      'components': path.resolve(__dirname, './src/components'),
    },
  },
})
