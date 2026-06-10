import codegenPreset from './preset'

// PORT NOTE: the v1 `hooks['tokens:created']` customization (formatTokenName /
// formatCssVar via `configure`) was removed in v2 and has no replacement yet,
// so this scenario only keeps the custom separator.
export default {
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda', codegenPreset],
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system-format-names',

  // The JSX framework to use
  jsxFramework: 'react',

  // Stitches preset
  separator: '-',
}
