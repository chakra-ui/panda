import { defineRecipe } from '@pandacss/dev'

// https://github.com/chakra-ui/chakra-ui/blob/f4b1ad66be1ada4b2728faef4c68a82a76f02532/packages/components/src/icon/icon.tsx

export const iconRecipe = defineRecipe({
  className: 'icon',
  base: {
    w: '1em',
    h: '1em',
    display: 'inline-block',
    lineHeight: '1em',
    flexShrink: 0,
    color: 'currentColor',
    verticalAlign: 'middle',
  },
})
