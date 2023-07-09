import { defineRecipe } from '@pandacss/dev'

export const splitter = defineRecipe({
  name: 'splitter',
  description: 'The styles for the splitter component',
  base: {
    flex: '1',

    '& [data-part="panel"]': {
      display: 'flex',
      alignItems: 'stretch',
    },

    '& [data-part="resize-trigger"]:not([data-disabled])': {
      background: 'border.default',
      position: 'relative',

      opacity: { _before: 0, _hover: { _before: 1 } },

      _before: {
        content: "''",
        transition: ' opacity .4s',
        bg: '#7d7d7d1a',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 3,
      },

      _vertical: {
        minHeight: '1px',
        _before: { top: '-6px', bottom: '-6px', w: 'full' },
      },

      _horizontal: {
        minWidth: '1px',
        _before: { right: '-10px', h: 'full' },
      },

      '&[hidden]': {
        display: 'none',
      },
    },
  },
})
