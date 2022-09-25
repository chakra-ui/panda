import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// import { pandaPlugin } from '@css-panda/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
