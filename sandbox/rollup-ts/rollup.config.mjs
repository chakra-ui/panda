import { nodeResolve } from '@rollup/plugin-node-resolve'
import { pandacss } from '@pandacss/rollup'
import esbuild from 'rollup-plugin-esbuild'

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/index.tsx',
  output: { dir: 'dist', format: 'es' },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // The generated styled-system React files carry `"use client"`; Rollup warns
  // it can't preserve the directive when bundling. Harmless here.
  onwarn(warning, warn) {
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
    warn(warning)
  },
  plugins: [
    // Panda must run before esbuild compiles the TSX away: the unplugin sets
    // `enforce: 'pre'`, so its transform sees the original `css()` / `styled` source.
    pandacss({ transform: true }),
    nodeResolve({ extensions: ['.mjs', '.js', '.ts', '.tsx', '.json'] }),
    esbuild({ target: 'es2020', jsx: 'automatic' }),
  ],
}
