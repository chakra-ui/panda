export default {
  preflight: true,
  include: ['src/**/*.tsx'],
  exclude: [],
  outdir: 'styled-system',
  jsxFactory: 'panda',
  jsxFramework: 'react',
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          500: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
        },
        danger: {
          500: { value: '#dc2626' },
        },
      },
    },
    recipes: {
      button: {
        className: 'button',
        jsx: ['Button'],
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '6px',
          fontWeight: '600',
        },
        variants: {
          size: {
            sm: { padding: '8px 12px', fontSize: '14px' },
            md: { padding: '10px 16px', fontSize: '16px' },
          },
          tone: {
            brand: { backgroundColor: 'brand.500', color: 'white' },
            danger: { backgroundColor: 'danger.500', color: 'white' },
          },
        },
        defaultVariants: {
          size: 'md',
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
    backgroundColor: { className: 'bg', values: 'colors', shorthand: 'bgColor' },
    color: { className: 'text', values: 'colors' },
    gap: { className: 'gap' },
    padding: { className: 'p' },
    paddingInline: { className: 'px' },
    paddingBlock: { className: 'py' },
    borderRadius: { className: 'rounded' },
    borderWidth: { className: 'border' },
    boxShadow: { className: 'shadow' },
    fontSize: { className: 'text-size' },
    fontWeight: { className: 'font' },
  },
  globalCss: {
    body: {
      margin: '0',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
  },
}
