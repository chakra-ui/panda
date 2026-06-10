export default {
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: [
    './node_modules/@sandbox-nuxt-lib-source/css-lib/src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{vue,ts,tsx}',
    './components/**/*.{vue,ts,tsx}',
  ],
  exclude: [],
  outdir: '@sandbox-nuxt-lib-source/styled-system',
  jsxFramework: 'vue',
}
