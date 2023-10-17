import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: [
    './node_modules/@sandbox-nuxt-lib-source/css-lib/src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{vue,ts,tsx}',
    './components/**/*.{vue,ts,tsx}'
  ],
  exclude: [],
  emitPackage: true,
  outdir: "@sandbox-nuxt-lib-source/styled-system",
  jsxFramework: 'vue',
})
