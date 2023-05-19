import { tabsAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts(tabsAnatomy.build())

export const codeTabsRecipe = defineRecipe({
  name: 'codeTabs',
  jsx: ['CodeTabs'],
  base: parts({
    root: {
      rounded: '19px',
      overflowX: 'auto',
      overflowY: 'hidden',
      overscrollBehaviorX: 'contain',
      // @ts-expect-error
      '& > .code > style + div': {
        borderTopRadius: '19px!',
        "& [data-part='tablist'] + div": {
          display: 'none'
        }
      }
    },
    tablist: {
      display: 'flex',
      w: '100%',
      gap: 5,
      px: 5,
      py: 7,
      rounded: '19px'
    },
    trigger: {
      w: '100%',
      rounded: '10px',
      py: 3,
      transitionProperty: 'colors',
      userSelect: 'none',
      color: 'white',
      backgroundColor: 'rgba(246, 228, 88, 0.09)', // panda.yellow
      textStyle: 'md',
      _hover: {
        color: 'black',
        backgroundColor: 'panda.yellow'
      },
      _selected: {
        color: 'black',
        backgroundColor: 'panda.yellow'
      }
    },
    content: {
      roundedBottom: '19px',
      '& > pre': {
        roundedBottom: '19px'
      }
    }
  })
})
