import { defineConfig } from '@pandacss/dev'

const makePrimaryColor = (l: number) => {
  return { value: `hsl(var(--nextra-primary-hue) 100% ${l}%)` }
}

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets'],
  // define the content to scan 👇🏻
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}', './theme.tsx'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  utilities: {
    extend: {
      transitionProperty: {
        transform(value) {
          return {
            transitionProperty: value,
            transitionDuration: '.15s',
            transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)'
          }
        }
      }
    }
  },
  conditions: {
    extend: {
      dark: '.dark &',
      light: '.light &'
    }
  },
  theme: {
    extend: {
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      },
      tokens: {
        fontSizes: {
          xs: { value: '.75rem' },
          sm: { value: '.875rem' },
          base: { value: '1rem' },
          lg: { value: '1.125rem' },
          xl: { value: '1.25rem' },
          '2xl': { value: '1.5rem' },
          '3xl': { value: '1.875rem' },
          '4xl': { value: '2.25rem' },
          '5xl': { value: '3rem' },
          '6xl': { value: '4rem' }
        },
        colors: {
          current: { value: 'currentColor' },
          dark: { value: '#111' },
          black: { value: '#000' },
          white: { value: '#fff' },
          primary: {
            50: makePrimaryColor(97),
            100: makePrimaryColor(94),
            200: makePrimaryColor(86),
            300: makePrimaryColor(77),
            400: makePrimaryColor(66),
            500: makePrimaryColor(50),
            600: makePrimaryColor(45),
            700: makePrimaryColor(39),
            750: makePrimaryColor(35),
            800: makePrimaryColor(32),
            900: makePrimaryColor(24)
          } as any,
          slate: {
            50: { value: '#f8fafc' },
            100: { value: '#f1f5f9' },
            200: { value: '#e2e8f0' },
            300: { value: '#cbd5e1' },
            400: { value: '#94a3b8' },
            500: { value: '#64748b' },
            600: { value: '#475569' },
            700: { value: '#334155' },
            800: { value: '#1e293b' },
            900: { value: '#0f172a' },
            950: { value: '#020617' }
          },
          gray: {
            50: { value: '#f9fafb' },
            100: { value: '#f3f4f6' },
            200: { value: '#e5e7eb' },
            300: { value: '#d1d5db' },
            400: { value: '#9ca3af' },
            500: { value: '#6b7280' },
            600: { value: '#4b5563' },
            700: { value: '#374151' },
            800: { value: '#1f2937' },
            900: { value: '#111827' },
            950: { value: '#030712' }
          },
          zinc: {
            50: { value: '#fafafa' },
            100: { value: '#f4f4f5' },
            200: { value: '#e4e4e7' },
            300: { value: '#d4d4d8' },
            400: { value: '#a1a1aa' },
            500: { value: '#71717a' },
            600: { value: '#52525b' },
            700: { value: '#3f3f46' },
            800: { value: '#27272a' },
            900: { value: '#18181b' },
            950: { value: '#09090b' }
          },
          neutral: {
            50: { value: '#fafafa' },
            100: { value: '#f5f5f5' },
            200: { value: '#e5e5e5' },
            300: { value: '#d4d4d4' },
            400: { value: '#a3a3a3' },
            500: { value: '#737373' },
            600: { value: '#525252' },
            700: { value: '#404040' },
            800: { value: '#262626' },
            900: { value: '#171717' },
            950: { value: '#0a0a0a' }
          },
          stone: {
            50: { value: '#fafaf9' },
            100: { value: '#f5f5f4' },
            200: { value: '#e7e5e4' },
            300: { value: '#d6d3d1' },
            400: { value: '#a8a29e' },
            500: { value: '#78716c' },
            600: { value: '#57534e' },
            700: { value: '#44403c' },
            800: { value: '#292524' },
            900: { value: '#1c1917' },
            950: { value: '#0c0a09' }
          },
          red: {
            50: { value: '#fef2f2' },
            100: { value: '#fee2e2' },
            200: { value: '#fecaca' },
            300: { value: '#fca5a5' },
            400: { value: '#f87171' },
            500: { value: '#ef4444' },
            600: { value: '#dc2626' },
            700: { value: '#b91c1c' },
            800: { value: '#991b1b' },
            900: { value: '#7f1d1d' },
            950: { value: '#450a0a' }
          },
          orange: {
            50: { value: '#fff7ed' },
            100: { value: '#ffedd5' },
            200: { value: '#fed7aa' },
            300: { value: '#fdba74' },
            400: { value: '#fb923c' },
            500: { value: '#f97316' },
            600: { value: '#ea580c' },
            700: { value: '#c2410c' },
            800: { value: '#9a3412' },
            900: { value: '#7c2d12' },
            950: { value: '#431407' }
          },
          amber: {
            50: { value: '#fffbeb' },
            100: { value: '#fef3c7' },
            200: { value: '#fde68a' },
            300: { value: '#fcd34d' },
            400: { value: '#fbbf24' },
            500: { value: '#f59e0b' },
            600: { value: '#d97706' },
            700: { value: '#b45309' },
            800: { value: '#92400e' },
            900: { value: '#78350f' },
            950: { value: '#451a03' }
          },
          yellow: {
            50: { value: '#fefce8' },
            100: { value: '#fef9c3' },
            200: { value: '#fef08a' },
            300: { value: '#fde047' },
            400: { value: '#facc15' },
            500: { value: '#eab308' },
            600: { value: '#ca8a04' },
            700: { value: '#a16207' },
            800: { value: '#854d0e' },
            900: { value: '#713f12' },
            950: { value: '#422006' }
          },
          lime: {
            50: { value: '#f7fee7' },
            100: { value: '#ecfccb' },
            200: { value: '#d9f99d' },
            300: { value: '#bef264' },
            400: { value: '#a3e635' },
            500: { value: '#84cc16' },
            600: { value: '#65a30d' },
            700: { value: '#4d7c0f' },
            800: { value: '#3f6212' },
            900: { value: '#365314' },
            950: { value: '#1a2e05' }
          },
          green: {
            50: { value: '#f0fdf4' },
            100: { value: '#dcfce7' },
            200: { value: '#bbf7d0' },
            300: { value: '#86efac' },
            400: { value: '#4ade80' },
            500: { value: '#22c55e' },
            600: { value: '#16a34a' },
            700: { value: '#15803d' },
            800: { value: '#166534' },
            900: { value: '#14532d' },
            950: { value: '#052e16' }
          },
          emerald: {
            50: { value: '#ecfdf5' },
            100: { value: '#d1fae5' },
            200: { value: '#a7f3d0' },
            300: { value: '#6ee7b7' },
            400: { value: '#34d399' },
            500: { value: '#10b981' },
            600: { value: '#059669' },
            700: { value: '#047857' },
            800: { value: '#065f46' },
            900: { value: '#064e3b' },
            950: { value: '#022c22' }
          },
          teal: {
            50: { value: '#f0fdfa' },
            100: { value: '#ccfbf1' },
            200: { value: '#99f6e4' },
            300: { value: '#5eead4' },
            400: { value: '#2dd4bf' },
            500: { value: '#14b8a6' },
            600: { value: '#0d9488' },
            700: { value: '#0f766e' },
            800: { value: '#115e59' },
            900: { value: '#134e4a' },
            950: { value: '#042f2e' }
          },
          cyan: {
            50: { value: '#ecfeff' },
            100: { value: '#cffafe' },
            200: { value: '#a5f3fc' },
            300: { value: '#67e8f9' },
            400: { value: '#22d3ee' },
            500: { value: '#06b6d4' },
            600: { value: '#0891b2' },
            700: { value: '#0e7490' },
            800: { value: '#155e75' },
            900: { value: '#164e63' },
            950: { value: '#083344' }
          },
          sky: {
            50: { value: '#f0f9ff' },
            100: { value: '#e0f2fe' },
            200: { value: '#bae6fd' },
            300: { value: '#7dd3fc' },
            400: { value: '#38bdf8' },
            500: { value: '#0ea5e9' },
            600: { value: '#0284c7' },
            700: { value: '#0369a1' },
            800: { value: '#075985' },
            900: { value: '#0c4a6e' },
            950: { value: '#082f49' }
          },
          blue: {
            50: { value: '#eff6ff' },
            100: { value: '#dbeafe' },
            200: { value: '#bfdbfe' },
            300: { value: '#93c5fd' },
            400: { value: '#60a5fa' },
            500: { value: '#3b82f6' },
            600: { value: '#2563eb' },
            700: { value: '#1d4ed8' },
            800: { value: '#1e40af' },
            900: { value: '#1e3a8a' },
            950: { value: '#172554' }
          },
          indigo: {
            50: { value: '#eef2ff' },
            100: { value: '#e0e7ff' },
            200: { value: '#c7d2fe' },
            300: { value: '#a5b4fc' },
            400: { value: '#818cf8' },
            500: { value: '#6366f1' },
            600: { value: '#4f46e5' },
            700: { value: '#4338ca' },
            800: { value: '#3730a3' },
            900: { value: '#312e81' },
            950: { value: '#1e1b4b' }
          },
          violet: {
            50: { value: '#f5f3ff' },
            100: { value: '#ede9fe' },
            200: { value: '#ddd6fe' },
            300: { value: '#c4b5fd' },
            400: { value: '#a78bfa' },
            500: { value: '#8b5cf6' },
            600: { value: '#7c3aed' },
            700: { value: '#6d28d9' },
            800: { value: '#5b21b6' },
            900: { value: '#4c1d95' },
            950: { value: '#2e1065' }
          },
          purple: {
            50: { value: '#faf5ff' },
            100: { value: '#f3e8ff' },
            200: { value: '#e9d5ff' },
            300: { value: '#d8b4fe' },
            400: { value: '#c084fc' },
            500: { value: '#a855f7' },
            600: { value: '#9333ea' },
            700: { value: '#7e22ce' },
            800: { value: '#6b21a8' },
            900: { value: '#581c87' },
            950: { value: '#3b0764' }
          },
          fuchsia: {
            50: { value: '#fdf4ff' },
            100: { value: '#fae8ff' },
            200: { value: '#f5d0fe' },
            300: { value: '#f0abfc' },
            400: { value: '#e879f9' },
            500: { value: '#d946ef' },
            600: { value: '#c026d3' },
            700: { value: '#a21caf' },
            800: { value: '#86198f' },
            900: { value: '#701a75' },
            950: { value: '#4a044e' }
          },
          pink: {
            50: { value: '#fdf2f8' },
            100: { value: '#fce7f3' },
            200: { value: '#fbcfe8' },
            300: { value: '#f9a8d4' },
            400: { value: '#f472b6' },
            500: { value: '#ec4899' },
            600: { value: '#db2777' },
            700: { value: '#be185d' },
            800: { value: '#9d174d' },
            900: { value: '#831843' },
            950: { value: '#500724' }
          },
          rose: {
            50: { value: '#fff1f2' },
            100: { value: '#ffe4e6' },
            200: { value: '#fecdd3' },
            300: { value: '#fda4af' },
            400: { value: '#fb7185' },
            500: { value: '#f43f5e' },
            600: { value: '#e11d48' },
            700: { value: '#be123c' },
            800: { value: '#9f1239' },
            900: { value: '#881337' },
            950: { value: '#4c0519' }
          }
        }
      },
      keyframes: {
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeout: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        }
      }
    }
  },
  globalCss: {
    // nextra specific styles
    html: {
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textStyle: 'md',
      fontFeatureSettings: "'rlig' 1, 'calt' 1, 'ss01' 1",
      WebkitTapHighlightColor: 'transparent'
    },
    body: {
      w: '100%',
      bg: 'white',
      _dark: {
        bg: 'dark',
        color: 'gray.100'
      }
    },
    "a, summary, button, input, [tabindex]:not([tabindex='-1'])": {
      outline: 'none',
      _focusVisible: {
        outline: '2px',
        outlineColor: 'primary.200',
        outlineOffset: '1px',
        outlineStyle: 'solid',
        // nx-ring-offset-primary-300
        _dark: {
          outlineColor: 'primary.800'
          // dark:nx-ring-offset-primary-700
        }
      }
    },
    'a, summary': {
      rounded: 'md'
    },
    'article:before': {
      _motionReduce: {
        mdDown: {
          transition: 'none'
        }
      }
    },
    /* Content Typography */
    'article details > summary': {
      '&::-webkit-details-marker': {
        display: 'none'
      },
      _before: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z' clip-rule='evenodd' /%3E%3C/svg%3E")`,
        height: '1.2em',
        width: '1.2em',
        verticalAlign: '-4px'
      }
    },
    '@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))':
      {
        '.nextra-search ul': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          _dark: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        },
        '.nextra-nav-container-blur': {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          _dark: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)'
          }
        },
        '.nextra-button': {
          // @apply nx-backdrop-blur-md nx-bg-opacity-[.85] dark:nx-bg-opacity-80;
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          _dark: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)'
          }
        }
      },
    "input[type='search']": {
      '&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
        {
          WebkitAppearance: 'none'
        }
    },
    '.contains-task-list': {
      ml: 0,
      listStyle: 'none',
      "input[type='checkbox']": {
        mr: 1
      }
    },
    '.nextra-cards': {
      gridTemplateColumns:
        'repeat(auto-fill, minmax(max(250px, calc((100% - 1rem * 2) / var(--rows))), 1fr))'
    },
    '.nextra-card img': {
      userSelect: 'none'
    },
    '.nextra-card:hover svg': {
      color: 'currentColor'
    },
    '.nextra-card svg': {
      width: '1.5rem',
      color: '#00000033',
      _dark: { color: '#ffffff66', _hover: { color: 'currentColor' } },
      transition: 'color 0.3s ease'
    },
    '.nextra-card p': {
      mt: '0.5rem'
    },
    '.nextra-card h3': {
      counterIncrement: 'step',
      _before: {
        content: 'counter(step)',
        position: 'absolute',
        width: '33px',
        height: '33px',
        border: '4px solid white',
        backgroundColor: 'gray.100',
        _dark: {
          backgroundColor: 'neutral.800'
        },
        borderRadius: '9999px',
        color: 'neutral.400',
        fontSize: 'base',
        fontWeight: 'normal',
        textAlign: 'center',
        textIndent: '1px',
        mt: '3px',
        ml: '-41px'
      }
    },
    '.nextra-scrollbar': {
      scrollbarWidth: 'thin',
      scrollbarColor: 'oklch(55.55% 0 0 / 40%) transparent',
      scrollbarGutter: 'stable',
      '&::-webkit-scrollbar': {
        w: '3',
        h: '3'
      },
      '&::-webkit-scrollbar-track': {
        bg: 'transparent'
      },
      '&::-webkit-scrollbar-thumb': {
        rounded: '10px'
      },
      '&:hover::-webkit-scrollbar-thumb': {
        border: '3px solid transparent',
        backgroundColor: 'neutral.500',
        backgroundClip: 'content-box',
        // @apply nx-shadow-neutral-500/20 hover:nx-shadow-neutral-500/40;
        mdDown: {
          '.nextra-container &': {
            scrollbarGutter: 'auto'
          }
        }
      }
    },
    '.no-scrollbar': {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    code: {
      boxDecorationBreak: 'clone',
      fontFeatureSettings: "'rlig' 1, 'calt' 1, 'ss01' 1",
      '&[data-line-numbers] > .line': {
        display: 'inline-flex',
        pl: 2,
        '&::before': {
          counterIncrement: 'line',
          content: 'counter(line)',
          h: 'full',
          float: 'left',
          pr: 4,
          textAlign: 'right',
          minW: '2.6rem',
          color: 'gray.500'
        }
      },
      '& .line': {
        '&.highlighted': {
          bg: 'rgb(37 99 235 / 0.1)',
          text: 'rgb(37 99 235 / 0.5)',
          shadow: '2px 0 currentColor inset'
        },
        '& .highlighted': {
          rounded: 'md',
          bg: 'rgb(30 64 175 / 0.1)',
          shadow: '0 0 0 2px rgba(0,0,0,.3)',
          shadowColor: 'rgb(30 64 175 / 0.1)',
          _dark: {
            bg: 'rgb(147 197 253 / 0.3)',
            shadowColor: 'rgb(147 197 253 / 0.5)'
          }
        }
      }
    },
    pre: {
      contain: 'paint',
      '& code': {
        display: 'grid',
        minW: 'full',
        rounded: 'none',
        border: 'none',
        bg: 'transparent!',
        p: 0,
        textStyle: 'sm',
        lineHeight: '1.25rem',
        color: 'currentcolor',
        _dark: {
          bg: 'transparent!'
        },
        '& .line': {
          px: 4
        }
      },
      '&:not([data-theme])': {
        px: 4
      },
      'html[data-nextra-word-wrap] &': {
        wordBreak: 'break-word',
        whitespace: 'pre-wrap',
        md: {
          whitespace: 'pre'
        },
        '& .line': {
          display: 'inline-block'
        }
      },
      '& .nextra-copy-icon': {
        animation: 'fadein 0.3s ease forwards'
      }
    },
    '.subheading-anchor': {
      opacity: 0,
      transition: 'opacity',
      _lkr: { ml: 1 },
      _rtl: { mr: 1 },
      'span:target + &,&:hover > &,&:focus': {
        opacity: 1
      },
      'span + &,&:hover > &': {
        textDecoration: 'none'
      },
      '&:after': {
        content: "'#'",
        px: 1,
        color: 'gray.300',
        _dark: {
          color: 'neutral.700'
        },
        'span:target + &': {
          color: 'gray.400',
          _dark: {
            color: 'neutral.500'
          }
        }
      }
    }
  }
})
