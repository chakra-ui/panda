import nextra from 'nextra'

const withNextra = nextra({
  // Tell Nextra to use the custom theme as the layout
  theme: './src/index.tsx',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: true
  },
  codeHighlight: true
})

export default withNextra({
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com']
  }
  // Other Next.js configurations
  // i18n: {
  //   locales: ["default", "en", "de"],
  //   defaultLocale: "default",
  // },
})

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error)
})
