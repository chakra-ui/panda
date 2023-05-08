const withNextra = require('nextra')({
  // Tell Nextra to use the custom theme as the layout
  theme: './src/index.tsx',
  themeConfig: './theme.config.tsx',
  docsRepositoryBase: 'https://github.com/chakra-ui/panda-docs/blob/pages'
})

module.exports = withNextra({
  // Other Next.js configurations
  // i18n: {
  //   locales: ["default", "en", "de"],
  //   defaultLocale: "default",
  // },
})
