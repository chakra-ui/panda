import { sva } from '@/styled-system/css'
import { dialogAnatomy } from '@ark-ui/react/dialog'

export const dialogSlotRecipe = sva({
  slots: dialogAnatomy.keys(),
  className: 'chakra-dialog',
  base: {
    backdrop: {
      bg: 'blackAlpha.800',
      pos: 'fixed',
      left: 0,
      top: 0,
      w: '100dvw',
      h: '100dvh',
      zIndex: 'var(--z-index)'
    },
    positioner: {
      display: 'flex',
      width: '100dvw',
      height: '100dvh',
      position: 'fixed',
      p: '2',
      left: 0,
      top: 0,
      '--dialog-z-index': '200',
      zIndex: 'calc(var(--dialog-z-index) + var(--layer-index, 0))',
      justifyContent: 'center',
      overscrollBehaviorY: 'none'
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      width: '100%',
      outline: 0,
      borderRadius: 'md',
      textStyle: 'sm',
      my: 'var(--dialog-margin, var(--dialog-base-margin))',
      '--dialog-z-index': '200',
      zIndex: 'calc(var(--dialog-z-index) + var(--layer-index, 0))',
      bg: 'bg',
      boxShadow: 'lg'
    },
    title: {
      textStyle: 'lg',
      fontWeight: 'semibold'
    },
    description: {
      color: 'fg.muted'
    },
    closeTrigger: {
      pos: 'absolute',
      top: '2',
      insetEnd: '2'
    }
  },

  variants: {
    placement: {
      center: {
        positioner: {
          alignItems: 'center'
        },
        content: {
          '--dialog-base-margin': 'auto',
          mx: 'auto'
        }
      },
      top: {
        positioner: {
          alignItems: 'flex-start'
        },
        content: {
          '--dialog-base-margin': 'spacing.16',
          mx: 'auto'
        }
      },
      bottom: {
        positioner: {
          alignItems: 'flex-end'
        },
        content: {
          '--dialog-base-margin': 'spacing.16',
          mx: 'auto'
        }
      }
    },

    scrollBehavior: {
      inside: {
        positioner: {
          overflow: 'hidden'
        },
        content: {
          maxH: 'calc(100% - 7.5rem)'
        },
        body: {
          overflow: 'auto'
        }
      },
      outside: {
        positioner: {
          overflow: 'auto',
          pointerEvents: 'auto'
        }
      }
    },

    size: {
      xs: {
        content: {
          maxW: 'sm'
        }
      },
      sm: {
        content: {
          maxW: 'md'
        }
      },
      md: {
        content: {
          maxW: 'lg'
        }
      },
      lg: {
        content: {
          maxW: '2xl'
        }
      },
      xl: {
        content: {
          maxW: '4xl'
        }
      },
      cover: {
        positioner: {
          padding: '10'
        },
        content: {
          width: '100%',
          height: '100%',
          '--dialog-margin': '0'
        }
      },
      full: {
        content: {
          maxW: '100dvw',
          minH: '100dvh',
          '--dialog-margin': '0',
          borderRadius: '0'
        }
      }
    }
  },

  defaultVariants: {
    size: 'md',
    scrollBehavior: 'outside',
    placement: 'top'
  }
})
