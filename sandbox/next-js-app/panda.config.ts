export default {
  // No presets: template-literal syntax serializes prop-based class names
  // (`display_flex`); preset utility classNames would diverge from the runtime.

  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system',
  forceImportExtension: true,
  syntax: 'template-literal',
  jsxFramework: 'react',
}
