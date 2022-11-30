import { defineConfig } from '../src/index'
import { config } from '../src/presets'

export default defineConfig({
  preflight: true,
  ...config,
  include: ['./src/**/*.{tsx,jsx}'],
  exclude: [],
  outdir: 'design-system',
  semanticTokens: {
    colors: {
      text: { value: { base: '{colors.gray.600}', dark: '{colors.gray.400}' } },
      bg: { value: { base: '{colors.slate.900}', osLight: '{colors.white}' } },
      card: { value: { base: '{colors.slate.800}', osLight: '{colors.slate.200}' } },
    },
  },
  jsxFramework: 'react',
})
