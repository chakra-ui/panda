export default {
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: '@sandbox-nuxt-lib-source/styled-system',
  jsxFramework: 'vue',
}
