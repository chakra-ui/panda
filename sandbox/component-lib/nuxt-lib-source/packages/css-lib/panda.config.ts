import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: [
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  exclude: [],
  emitPackage: true,
  outdir: "@sandbox-nuxt-lib-source/styled-system",
  jsxFramework: 'vue',
})
