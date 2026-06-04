export default {
  preflight: true,
  include: ['src/**/*.tsx'],
  exclude: [],
  outdir: 'styled-system',
  codegenImportExtensions: true,
  importMap: {
    css: ['../styled-system/css/index.mjs'],
    recipe: ['../styled-system/recipes/index.mjs'],
    pattern: ['../styled-system/patterns/index.mjs'],
    jsx: ['../styled-system/jsx/index.mjs'],
    tokens: ['../styled-system/tokens/index.mjs'],
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eef6ff' },
          500: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
        },
      },
    },
  },
  utilities: {
    alignItems: { className: 'items' },
    backgroundColor: { className: 'bg', values: 'colors', shorthand: 'bgColor' },
    borderRadius: { className: 'rounded' },
    boxShadow: { className: 'shadow' },
    color: { className: 'text', values: 'colors' },
    display: { className: 'd' },
    fontSize: { className: 'text-size' },
    fontWeight: { className: 'font' },
    gap: { className: 'gap' },
    minHeight: { className: 'min-h' },
    padding: { className: 'p' },
    placeItems: { className: 'place-items' },
  },
  globalCss: {
    body: {
      margin: '0',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
  },
}
