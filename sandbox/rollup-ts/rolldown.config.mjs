import { pandacss } from '@pandacss/rollup'

// Rolldown has built-in TS/JSX + node resolution (OXC), so unlike the Rollup
// config there's no esbuild/node-resolve — just the Panda plugin. This exercises
// whether the Rollup-shaped plugin runs unchanged under Rolldown.
export default {
  input: 'src/index.tsx',
  output: { dir: 'dist-rolldown', format: 'es', sourcemap: true },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  jsx: 'react-jsx',
  plugins: [pandacss({ transform: true })],
}
