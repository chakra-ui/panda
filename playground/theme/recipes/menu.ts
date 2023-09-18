import { defineParts, defineRecipe } from '@pandacss/dev'
import { menuAnatomy } from '@ark-ui/react'

const parts = defineParts(menuAnatomy.build())

const itemStyle = {
  alignItems: 'center',
  borderRadius: 'md',
  cursor: 'pointer',
  display: 'flex',
  fontWeight: 'medium',
  textStyle: 'sm',
  transitionDuration: 'fast',
  transitionProperty: 'background, color',
  transitionTimingFunction: 'default',
  h: '10',
  px: '2.5',
  mx: '1',
  _hover: {
    bg: { base: 'gray.100', _dark: '#262626' },
  },
  _highlighted: {
    bg: { base: 'gray.100', _dark: '#262626' },
  },
} as const

export const menu = defineRecipe({
  className: 'menu',
  description: 'The styles for the menu component',
  base: parts({
    content: {
      bg: { base: 'white', _dark: '#282828' },
      backdropFilter: 'blur(10px)',
      borderRadius: 'md',
      borderWidth: '1px',
      boxShadow: 'lg',
      display: 'flex',
      flexDirection: 'column',
      outline: 'none',
      width: 'calc(100% + 2rem)',
      py: '1',
      gap: '1',
      _hidden: {
        display: 'none',
      },
      _open: {
        animation: 'fadeIn 0.25s ease-out',
      },
      _closed: {
        animation: 'fadeOut 0.2s ease-out',
      },
    },
    itemGroupLabel: {
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    positioner: {
      zIndex: '100',
    },
    itemGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    item: itemStyle,
    optionItem: itemStyle,
    triggerItem: itemStyle,
  }),
})
