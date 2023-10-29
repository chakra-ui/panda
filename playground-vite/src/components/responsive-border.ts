import { cva } from 'styled-system/css'

export const responsiveBorder = cva({
  base: {
    pos: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bg: { base: 'rgba(233,236,239,1)', _dark: 'rgba(24,24,24,0.3)' },
    transition: 'background-color 0.2s ease-in-out',
    '&[data-resizing], &:hover': {
      bg: { base: 'rgb(204 204 204 / 63%)', _dark: 'rgba(24,24,24,0.5)' },
    },
    '& svg': {
      color: { base: 'rgba(156,163,175,1)', _dark: '#FFFFFF4D' },
    },
  },

  variants: {
    position: {
      top: {
        mt: '-4',
        h: '4',
        w: 'full',
        cursor: 'ns-resize',
      },
      left: {
        ml: '-4',
        h: 'full',
        w: '4',
        cursor: 'ew-resize',
      },
      right: {
        right: 0,
        mr: '-4',
        h: 'full',
        w: '4',
        cursor: 'ew-resize',
      },
      bottom: {
        bottom: 0,
        mb: '-4',
        h: '4',
        w: 'full',
        cursor: 'ns-resize',
        '& svg': {
          transform: 'rotate(90deg)',
        },
      },
      bottomRight: {
        right: 0,
        bottom: 0,
        mr: '-4',
        mb: '-4',
        h: '4',
        w: '4',
        cursor: 'nwse-resize',
        '& svg': {
          transform: 'rotate(45deg)',
          mt: '-1',
          ml: '-1',
        },
      },
      bottomLeft: {
        left: 0,
        bottom: 0,
        ml: '-4',
        mb: '-4',
        h: '4',
        w: '4',
        cursor: 'nesw-resize',
        '& svg': {
          transform: 'rotate(-45deg)',
          mt: '-1',
          mr: '-1',
        },
      },
      topLeft: {
        top: 0,
        left: 0,
        ml: '-4',
        mt: '-4',
        h: '4',
        w: '4',
        cursor: 'nwse-resize',
        '& svg': {
          transform: 'rotate(-135deg)',
          mb: '-1',
          mr: '-1',
        },
      },
      topRight: {
        top: 0,
        right: 0,
        mr: '-4',
        mt: '-4',
        h: '4',
        w: '4',
        cursor: 'nesw-resize',
        '& svg': {
          transform: 'rotate(135deg)',
          mb: '-1',
          ml: '-1',
        },
      },
    },
  },
})
