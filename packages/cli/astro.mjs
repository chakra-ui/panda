import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export default function pandacss() {
  return {
    name: '@pandacss/vite',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        config.style.postcss.plugins.push(require('css-panda/postcss'))
      },
    },
  }
}
