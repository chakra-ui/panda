import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env.PANDA_DEBUG': JSON.stringify(''),
    __dirname: JSON.stringify(__dirname),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
        'process.env.PANDA_DEBUG': JSON.stringify(false),
      },
      plugins: [NodeGlobalsPolyfillPlugin({ process: true, buffer: true })],
    },
  },
  resolve: {
    alias: {
      process: 'process/browser',
      os: 'os-browserify',
      path: 'path-browserify',
      util: 'util',
      module: path.join(__dirname, './module.shim.ts'),
      '@vue/compiler-sfc': '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js',
    },
  },
})
