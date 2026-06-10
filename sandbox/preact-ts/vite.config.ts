import pandacss from '@pandacss/vite'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [pandacss(), tsconfigPaths(), preact()],
  resolve: {
    conditions: ['source'],
  },
})
