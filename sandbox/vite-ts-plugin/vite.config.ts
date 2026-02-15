import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pandacss from '@pandacss/vite'

export default defineConfig({
  plugins: [pandacss(), react()],
  resolve: {
    conditions: ['source'],
  },
})
