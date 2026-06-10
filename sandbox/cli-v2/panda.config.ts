export default {
  preflight: true,
  include: ['src/**/*.tsx'],
  exclude: [],
  outdir: 'styled-system',
  // explicit: the app imports `styled-system/jsx/index.mjs`-style paths
  codegenFormat: 'mjs',
  codegenImportExtensions: true,
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
        white: { value: '#ffffff' },
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
            lg: { padding: '12px 20px', fontSize: '18px' },
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
        compoundVariants: [
          {
            size: ['sm', 'lg'],
            tone: 'danger',
            css: {
              borderWidth: '2px',
              boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.2)',
            },
          },
          {
            size: 'md',
            tone: 'brand',
            css: {
              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.2)',
            },
          },
        ],
      },
    },
    slotRecipes: {
      card: {
        className: 'card',
        slots: ['root', 'title', 'content'],
        base: {
          root: {
            display: 'grid',
            gap: '8px',
            padding: '16px',
            borderRadius: '12px',
          },
          title: {
            fontWeight: '700',
          },
          content: {
            fontSize: '14px',
          },
        },
        variants: {
          size: {
            sm: {
              root: { padding: '12px' },
              content: { fontSize: '13px' },
            },
            md: {
              root: { padding: '16px' },
              content: { fontSize: '15px' },
            },
          },
          tone: {
            brand: {
              root: { backgroundColor: 'brand.50' },
              title: { color: 'brand.700' },
            },
            danger: {
              root: { backgroundColor: 'danger.500' },
              title: { color: 'white' },
              content: { color: 'white' },
            },
          },
        },
        defaultVariants: {
          size: 'sm',
          tone: 'brand',
        },
        compoundVariants: [
          {
            size: ['sm', 'md'],
            tone: 'brand',
            css: {
              root: {
                borderWidth: '1px',
                boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
              },
              title: {
                fontWeight: '800',
              },
            },
          },
          {
            size: 'md',
            tone: 'danger',
            css: {
              root: {
                boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.18)',
              },
              content: {
                fontWeight: '600',
              },
            },
          },
        ],
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
