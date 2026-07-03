import { defineConfig, defineGlobalStyles, defineRecipe } from '@pandacss/dev'

export default defineConfig({
  outdir: 'styled-system',

  theme: {
    tokens: {
      colors: {
        red: { 500: { value: '#ef4444' } },
        blue: { 500: { value: '#3b82f6' } },
      },
      spacing: {
        4: { value: '1rem' },
      },
    },
    semanticTokens: {
      colors: {
        // Try it: put your cursor inside the string below (e.g. right after "colors.re")
        // and retype — you should see colors.red.500 suggested.
        danger: { value: '{colors.red.500}' },
      },
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
    },
    keyframes: {
      spin: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
    },
    recipes: {
      button: defineRecipe({
        className: 'button',
        base: {
          // Try it: put your cursor on a new line here and start typing —
          // "pa" -> padding, "anim" -> animationName, "_h" -> the hover condition, "sm" -> the breakpoint.
          color: 'blue.500',
        },
        variants: {
          size: {
            sm: {
              // Variant leaves are style objects too — try typing a property here.
              padding: '4',
            },
          },
        },
      }),
    },
  },

  conditions: {
    hover: '&:hover',
    focus: '&:focus-visible',
  },

  utilities: {
    color: { className: 'c', values: 'colors' },
    padding: { className: 'p', values: 'spacing', shorthand: 'p' },
    animationName: { className: 'anim', values: 'keyframes' },
    scrollbar: { className: 'scr', values: ['visible', 'hidden'] },
  },

  globalCss: defineGlobalStyles({
    html: {
      // Try it: put your cursor right after the "'" below and type "re" —
      // you should see red.500 (plus inherit/initial/unset/revert/revert-layer) suggested.
      color: 'red.500',
      // Try it: put your cursor on a new line here and type "_h" or "sm" —
      // you should see _hover, _focus, sm, md, lg suggested as new keys.
    },
  }),
})
