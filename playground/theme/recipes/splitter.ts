import { defineParts, defineRecipe } from '@pandacss/dev'
import { splitterAnatomy } from '@ark-ui/react'

const parts = defineParts(splitterAnatomy.build())

export const splitter = defineRecipe({
  className: 'splitter',
  description: 'The styles for the splitter component',
  base: parts({
    root: {
      flex: '1',
    },
    panel: {
      display: 'flex',
      alignItems: 'stretch',
    },
    resizeTrigger: {
      '&:not([data-disabled])': {
        background: 'border.default',
        position: 'relative',
        outline: '0',

        opacity: { _before: 0, _hover: { _before: 1 } },

        _before: {
          content: "''",
          transition: ' opacity .4s',
          bg: '#7d7d7d1a',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 4,
        },

        _vertical: {
          minHeight: '1px',
          _before: { top: '-6px', bottom: '-6px', w: 'full' },
        },

        _horizontal: {
          minWidth: '1px',
          _before: { left: '-10px', h: 'full' },
        },

        '&[hidden]': {
          display: 'none',
        },
      },
    },
  }),
})
