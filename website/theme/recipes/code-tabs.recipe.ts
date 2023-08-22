import { tabsAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts(tabsAnatomy.build())

export const codeTabsRecipe = defineRecipe({
  className: 'codeTabs',
  jsx: ['CodeTabs'],
  base: parts({
    root: {
      rounded: 'xl',
      overflowX: 'auto',
      overflowY: 'hidden',
      overscrollBehaviorX: 'contain',
      '& > div > div': {
        borderTopRadius: 'xl!'
      }
    },
    tablist: {
      display: 'flex',
      w: '100%',
      gap: 5,
      px: '4',
      py: '4',
      rounded: 'xl'
    },
    trigger: {
      w: '100%',
      rounded: '10px',
      py: '3',
      transition: 'colors',
      userSelect: 'none',
      color: 'white',
      bg: 'rgba(246, 228, 88, 0.09)',
      textStyle: 'md',
      _hover: {
        color: 'black',
        bg: 'yellow.400'
      },
      _selected: {
        color: 'black',
        bg: 'yellow.400'
      }
    },
    content: {
      roundedBottom: '19px',
      '& > pre': {
        roundedBottom: '19px'
      },
      '& code': {
        fontFamily: 'mono',
        fontSize: 'md',
        lineHeight: '1.7',
        fontWeight: '500'
      }
    }
  })
})
