export default {
  include: ['routes/**/*.{ts,tsx}', 'islands/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  exclude: ['node_modules', '.deno', '_fresh', 'styled-system'],
  outdir: 'styled-system',
  codegenFormat: 'ts',
  codegenImportExtensions: true,
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          500: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
        },
        ink: {
          900: { value: '#111827' },
        },
      },
    },
    recipes: {
      badge: {
        className: 'badge',
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '999px',
          fontWeight: '700',
          padding: '6px 12px',
        },
        variants: {
          tone: {
            brand: { backgroundColor: 'brand.500', color: 'white' },
          },
        },
        defaultVariants: {
          tone: 'brand',
        },
      },
    },
  },
  utilities: {
    display: { className: 'd' },
    minHeight: { className: 'min-h' },
    placeItems: { className: 'place-items' },
    alignItems: { className: 'items' },
    backgroundColor: { className: 'bg', values: 'colors', shorthand: 'bg' },
    color: { className: 'text', values: 'colors' },
    gap: { className: 'gap' },
    padding: { className: 'p' },
    borderRadius: { className: 'rounded' },
    fontWeight: { className: 'font' },
  },
  globalCss: {
    body: {
      margin: '0',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
}
