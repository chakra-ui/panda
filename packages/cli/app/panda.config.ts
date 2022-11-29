import { defineConfig } from '../src/index'
import { config } from '../src/presets'

export default defineConfig({
  preflight: true,
  ...config,
  // presets: ['../src/presets'],
  include: ['./src/**/*.{tsx,jsx}'],
  exclude: [],
  outdir: 'design-system',
  semanticTokens: {
    colors: {
      text: { value: { base: '{colors.gray.600}', dark: '{colors.green.400}' } },
      bg: { value: { base: '#242424', osLight: '#ffffff' } },
    },
  },
  layerStyles: {
    'token-group': {
      value: {
        display: 'flex',
        flexDir: 'column',
        gap: '12px',
        width: 'full',
        marginTop: '20px',
      },
    },

    'token-content': {
      value: {
        display: 'flex',
        flexDir: 'column',
        gap: '20px',
        lineHeight: '15px',
      },
    },

    spacing: {
      switch: {
        value: {
          display: 'flex',
          alignItems: 'center',
          gap: '1',
          whiteSpace: 'nowrap',
          position: 'sticky',
          top: 0,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          background: 'var(--bg)',

          '& > span': {
            fontWeight: 'bold',
          },
        },
      },
      section: {
        value: {
          '& > span': {
            fontWeight: 'bold',
          },
          '& > div': {
            marginTop: '3',
          },

          '& .pad': {
            backgroundSize: '7.07px 7.07px',
            width: 'fit-content',
            borderRadius: '0.5rem',
          },

          '& .pad-all': {
            backgroundImage: `linear-gradient(
              135deg,
              hsla(0, 0%, 100%, 0.75) 10%,
              transparent 0,
              transparent 50%,
              hsla(0, 0%, 100%, 0.75) 0,
              hsla(0, 0%, 100%, 0.75) 60%,
              transparent 0,
              transparent
            )`,
            backgroundColor: 'rgb(139 92 246)',
            '& .padding-item': {
              background: 'rgb(139 92 246)',
            },
          },

          '& .pad-h': {
            backgroundImage: `linear-gradient(
              135deg,
              hsla(0, 0%, 100%, 0.75) 10%,
              transparent 0,
              transparent 50%,
              hsla(0, 0%, 100%, 0.75) 0,
              hsla(0, 0%, 100%, 0.75) 60%,
              transparent 0,
              transparent
            )`,
            backgroundColor: 'rgb(99 102 241)',
            '& .padding-item': {
              background: 'rgb(99 102 241)',
            },
          },

          '& .pad-v': {
            backgroundImage: `linear-gradient(
              135deg,
              hsla(0, 0%, 100%, 0.75) 10%,
              transparent 0,
              transparent 50%,
              hsla(0, 0%, 100%, 0.75) 0,
              hsla(0, 0%, 100%, 0.75) 60%,
              transparent 0,
              transparent
            )`,
            backgroundColor: 'rgb(236 72 153)',
            '& .padding-item': {
              background: 'rgb(236 72 153)',
            },
          },
        },
      },
      paddingItem: {
        value: {
          display: 'flex',
          background: 'rgb(99 102 241)',
          width: '56px',
          height: '56px',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          paddingInline: '3',
        },
      },
    },
  },
  jsxFramework: 'react',

  recipes: {
    button: {
      name: 'button',
      description: 'A button styles',
      base: {
        fontSize: 'lg',
      },
      variants: {
        variant: {
          primary: {
            color: 'white',
            backgroundColor: 'blue.500',
          },
        },
      },
    },
  },
})
