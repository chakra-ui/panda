import { defineSlotRecipe } from '@pandacss/dev'

export const docsTabsRecipe = defineSlotRecipe({
  className: 'docsTabs',
  slots: ['root', 'list', 'trigger', 'indicator', 'content'],
  description: 'Underlined tabs for docs content',
  base: {
    root: {
      overflowX: 'auto',
      overflowY: 'hidden',
      overscrollBehaviorX: 'contain'
    },
    list: {
      position: 'relative',
      mt: '4',
      display: 'flex',
      w: 'max',
      minW: 'full',
      borderBottomWidth: '1px',
      borderColor: 'border',
      pb: '1px'
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
      color: 'fg.muted',
      '&:not([aria-selected=true], [data-selected])': {
        _hover: { borderColor: 'border' }
      },
      _selected: {
        color: 'fg',
        borderColor: 'fg.subtle'
      }
    },
    indicator: {
      height: '2px',
      bottom: '-1px',
      background: 'fg.muted'
    },
    content: {
      rounded: 'md',
      pt: '6'
    }
  }
})
