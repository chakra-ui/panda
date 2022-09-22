import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import { pandaPlugin } from '@css-panda/vite'

export default defineConfig({
  plugins: [solidPlugin(), pandaPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
})
