import pandacss from '@pandacss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [pandacss(), tsconfigPaths(), react()],
})
