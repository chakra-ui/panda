import { tabsAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts(tabsAnatomy.build())

export const nextraTabsRecipe = defineRecipe({
  className: 'nextraTabs',
  description: 'A nextra documentation tabs style',
  base: parts({
    root: {
      overflowX: 'auto',
      overflowY: 'hidden',
      overscrollBehaviorX: 'contain'
    },
    tablist: {
      position: 'relative',
      mt: '4',
      display: 'flex',
      w: 'max',
      minW: 'full',
      borderBottomWidth: '1px',
      borderColor: 'neutral.200',
      pb: '1px',
      _dark: { borderColor: 'neutral.800' }
    },
    trigger: {
      roundedTop: 'md',
      p: '2',
      fontWeight: 'medium',
      lineHeight: '1.25rem',
      transition: 'colors',
      whiteSpace: 'nowrap',
      me: '2',
      mb: '-0.5',
      userSelect: 'none',
      borderBottomWidth: '2px',
      borderColor: 'transparent',
      _hover: {
        borderColor: 'neutral.200'
      },
      _dark: {
        borderColor: 'transparent',
        color: 'neutral.200'
      },
      _selected: {
        borderColor: 'neutral.500'
      }
    },
    indicator: {
      height: '2px',
      bottom: '-1px',
      background: 'neutral.600'
    },
    content: {
      rounded: 'md',
      pt: '6'
    }
  })
})
