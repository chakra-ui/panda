import { defineConfig } from '@pandacss/dev'
import { config } from '@pandacss/presets'

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'design-system',
  strictTokens: false,
  conditions: {
    resizeHandleActive: '[data-resize-handle-active] &',
    panelHorizontalActive: '[data-panel-group-direction="horizontal"] &',
    panelVerticalActive: '[data-panel-group-direction="vertical"] &',
  },
  utilities: {
    boxSize: {
      // @ts-ignore
      values: config.utilities?.width?.values,
      transform: (value) => {
        return {
          width: value,
          height: value,
        }
      },
    },
  },
})
