import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: '@sandbox-nuxt-lib-source/styled-system',
  jsxFramework: 'vue',
})
