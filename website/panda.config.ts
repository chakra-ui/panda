import { defineConfig } from '@pandacss/dev'
import preset from '@pandacss/dev/presets'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets'],
  // define the content to scan 👇🏻
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}', './theme.tsx'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  theme: {
    extend: {
      tokens: {
        colors: {
          dark: { value: '#111' },
          primary: preset.theme.tokens.colors.blue,
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
          bg: 'primary.600/10',
          text: 'primary.600/50',
          shadow: '2px 0 currentColor inset'
        },
        '& .highlighted': {
          rounded: 'md',
          bg: 'primary.800/10',
          shadow: '0 0 0 2px rgba(0,0,0,.3)',
          shadowColor: 'primary.800/10',
          _dark: {
            bg: 'primary.300/10',
            shadowColor: 'primary.300/50'
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
