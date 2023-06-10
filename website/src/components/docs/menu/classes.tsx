import { css } from '@/styled-system/css'

// TODO move classes closer to the component that uses them.
export const classes = {
  link: css({
    display: 'flex',
    rounded: 'md',
    px: 2,
    py: 1.5,
    textStyle: 'sm',
    transitionProperty: 'colors',
    wordBreak: 'break-word',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    _moreContrast: { border: '1px solid' }
  }),
  inactive: css({
    color: 'gray.500',
    _hover: { bg: 'gray.100', color: 'gray.900' },
    _dark: {
      color: 'neutral.500',
      _hover: {
        // bg: 'primary.100/5',
        bg: 'rgb(219 234 254 / 0.05)',
        color: 'gray.50'
      }
    },
    _moreContrast: {
      color: 'gray.900',
      _dark: {
        color: 'gray.50',
        _hover: {
          borderColor: 'gray.50'
        }
      },
      borderColor: 'transparent',
      _hover: {
        borderColor: 'gray.900'
      }
    }
  }),
  active: css({
    bg: 'yellow.200',
    fontWeight: 'semibold',
    color: 'black',
    _dark: {
      bg: 'yellow.300',
    },
    _moreContrast: {
      borderColor: 'gray.500',
      _dark: {
        borderColor: 'white'
      }
    }
  }),
  // This is inlined in the component.
  // list: css({ display: 'flex', flexDirection: 'column', gap: 1 }),
  border: css({
    position: 'relative',
    _before: {
      position: 'absolute',
      insetY: 1,
      width: '1px',
      bg: 'gray.200',
      content: "''",
      _dark: { bg: 'neutral.800' }
    },
    _ltr: { pl: 3, _before: { left: 0 } },
    _rtl: { pr: 3, _before: { right: 0 } }
  })
}
