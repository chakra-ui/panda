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
      text: { value: { base: '{colors.slate.200}', _osLight: '{colors.black}' } },
      bg: { value: { base: '{colors.slate.900}', _osLight: '{colors.white}' } },
      card: { value: { base: '{colors.slate.800}', _osLight: '{colors.slate.200}' } },
    },
  },
  utilities: {
    ...config.utilities,

    borderSlim: {
      className: 'border-slim',
      values: 'colors',
      transform(value) {
        return {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: value,
        }
      },
    },
  },
  jsxFramework: 'react',
})
