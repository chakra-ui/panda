import { defineGlobalStyles } from '@pandacss/dev'

export const globalCss = defineGlobalStyles({
  '*, *::before, *::after': {
    borderColor: 'border'
  },
  ':where(.shiki span:not(.highlighted))': {
    color: 'var(--shiki-light)',
    fontStyle: 'var(--shiki-light-font-style)',
    fontWeight: 'var(--shiki-light-font-weight)',
    textDecoration: 'var(--shiki-light-text-decoration)'
  },
  '.dark :where(.shiki span:not(.highlighted))': {
    color: 'var(--shiki-dark)',
    fontStyle: 'var(--shiki-dark-font-style)',
    fontWeight: 'var(--shiki-dark-font-weight)',
    textDecoration: 'var(--shiki-dark-text-decoration)'
  },
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': {
      animationDuration: '0.01ms!',
      animationIterationCount: '1!',
      transitionDuration: '0.01ms!',
      scrollBehavior: 'auto!'
    }
  },
  html: {
    fontFamily: 'sans',
    scrollbarGutter: 'stable',
    // Themes the page scrollbar and native form controls. `next-themes` only
    // toggles a class, so without this they keep following the OS instead.
    colorScheme: 'light',
    '--nextra-primary-hue': '212deg'
  },
  'html.dark, html[data-theme="dark"]': {
    colorScheme: 'dark'
  },
  /**
   * Anchor offset for the fixed navbar/banner/tab bar. It lives on the target
   * rather than on `html`, because the layouts declare these custom properties
   * on their own wrapper — `html` can't see them and would fall back to
   * desktop-only guesses (wrong on mobile, and blind to the docs tab bar).
   */
  ':is(h1, h2, h3, h4, h5, h6, [data-scroll-target])': {
    scrollMarginTop:
      'calc(var(--navbar-height, 4rem) + var(--banner-height, 2.5rem) + var(--tabbar-height, 0px) + 1.5rem)'
  },
  body: {
    bg: 'bg',
    color: 'fg',
    minHeight: '100vh',
    scrollMarginTop: '80px'
  },
  "a, summary, button, input, [tabindex]:not([tabindex='-1'])": {
    outline: 'none',
    _focusVisible: {
      outline: '2px',
      outlineColor: 'blue.400',
      outlineOffset: '1px',
      outlineStyle: 'solid'
    }
  },
  /* Content Typography */
  "input[type='search']": {
    '&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
      {
        WebkitAppearance: 'none'
      }
  },
  '.contains-task-list': {
    ml: '0',
    listStyle: 'none',
    "& input[type='checkbox']": {
      mr: '1'
    }
  },
  '.scroll-area': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'oklch(55.55% 0 0 / 40%) transparent',
    scrollbarGutter: 'stable',
    '&::-webkit-scrollbar': {
      w: '1.5',
      h: '1.5'
    },
    '&::-webkit-scrollbar-track': {
      bg: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      rounded: '10px'
    }
  },
  code: {
    boxDecorationBreak: 'clone',
    fontFeatureSettings: "'rlig' 1, 'calt' 1, 'ss01' 1",
    px: '0.3em',
    '&[data-line-numbers] > .line': {
      display: 'inline-flex',
      ps: '2',
      '&::before': {
        counterIncrement: 'line',
        content: 'counter(line)',
        h: 'full',
        float: 'left',
        pe: '4',
        textAlign: 'right',
        minW: '2.6rem',
        color: 'fg.subtle'
      }
    },
    '& .line': {
      px: '4',
      '&.highlighted': {
        bg: 'hsl(var(--nextra-primary-hue), 100%, 45%, 0.15)',
        color: 'hsl(var(--nextra-primary-hue), 100%, 45%, 0.5)',
        shadow: '2px 0 currentColor inset'
      },
      '& .highlighted': {
        rounded: 'md',
        bg: 'hsl(var(--nextra-primary-hue), 100%, 32%, 0.1)',
        shadow: '0 0 0 2px rgba(0,0,0,.3)',
        shadowColor: 'hsl(var(--nextra-primary-hue), 100%, 32%, 0.1)',
        _dark: {
          bg: 'hsl(var(--nextra-primary-hue), 100%, 77%, 0.1)',
          shadowColor: 'hsl(var(--nextra-primary-hue), 100%, 77%, 0.1)'
        }
      }
    }
  },
  pre: {
    '& code': {
      display: 'grid',
      minW: 'full',
      rounded: 'none',
      border: 'none',
      bg: 'transparent!',
      p: '0!',
      textStyle: 'sm',
      lineHeight: '1.25rem',
      color: 'currentcolor',
      _dark: {
        bg: 'transparent!'
      }
    },
    'html[data-word-wrap] &': {
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
      md: {
        whiteSpace: 'pre'
      },
      '& .line': {
        display: 'inline-block'
      }
    }
  },
  '.subheading-anchor': {
    opacity: 0,
    transition: 'opacity',
    ms: '1',
    'span:target + &, :hover > &, &:focus': {
      opacity: 1
    },
    'span + &,&:hover > &': {
      textDecoration: 'none'
    },
    '&:after': {
      content: "'#'",
      px: '1',
      color: 'fg.subtle',
      'span:target + &': {
        color: 'fg.muted'
      }
    }
  }
})
