import { toastAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts({
  ...toastAnatomy.build(),
  content: { selector: '& [data-part="content"]' },
  ellipse: { selector: '& [data-part="ellipse"]' },
  icon: { selector: '& [data-part="icon"]' },
})

export const toastRecipe = defineRecipe({
  className: 'toast',
  description: 'A toast style',
  base: parts({
    root: {
      display: 'inline-flex',
      px: '4',
      py: '2',
      alignItems: 'center',
      gap: '3',
      position: 'relative',
      overflow: 'hidden',

      borderRadius: 'md',
      borderWidth: '1px',
      borderColor: { _light: '#E4E4E4' },
      background: { base: 'white', _dark: '#262626' },

      boxShadow: {
        base: '0px 0px 12px 0px rgba(0, 0, 0, 0.05)',
        _dark: '2xl',
      },
    },
    group: {
      p: '1',
    },
    content: {
      display: 'inline-flex',
      gap: '1',
    },
    title: {
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    description: {
      textStyle: 'sm',
    },
    icon: {
      '&[data-type="success"]': {
        background: {
          base: 'rgba(122, 235, 66, 0.2)',
          _dark: 'rgba(122, 235, 66, 0.1)',
        },
      },
      '&[data-type="error"]': {
        background: {
          base: 'rgba(235, 94, 66, 0.2)',
          _dark: 'rgba(235, 94, 66, 0.1)',
        },
      },
      borderRadius: 'full',
      display: 'flex',
      padding: '1',
      alignItems: 'center',

      '& svg': {
        width: '20px',
        height: '20px',
      },
    },
  }),
})
