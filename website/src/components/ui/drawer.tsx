import { sva } from '@/styled-system/css'
import { dialogAnatomy } from '@ark-ui/react/dialog'

export const drawerSlotRecipe = sva({
  slots: [...dialogAnatomy.keys(), 'body'],
  className: 'chakra-drawer',
  base: {
    backdrop: {
      bg: 'blackAlpha.500',
      pos: 'fixed',
      insetInlineStart: 0,
      top: 0,
      w: '100vw',
      h: '100dvh',
      zIndex: 'overlay',
      _open: {
        animationName: 'fade-in',
        animationDuration: '200ms'
      },
      _closed: {
        animationName: 'fade-out',
        animationDuration: '150ms'
      }
    },
    positioner: {
      display: 'flex',
      width: '100vw',
      height: '100dvh',
      position: 'fixed',
      insetInlineStart: 0,
      top: 0,
      zIndex: 'modal',
      overscrollBehaviorY: 'none'
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      width: '100%',
      outline: 0,
      zIndex: 'modal',
      textStyle: 'sm',
      maxH: '100dvh',
      color: 'inherit',
      bg: 'bg',
      boxShadow: 'lg',
      _open: {
        animationDuration: '200ms',
        animationTimingFunction: 'ease-in-out'
      },
      _closed: {
        animationDuration: '150ms',
        animationTimingFunction: 'ease-in-out'
      }
    },
    body: {
      px: '4',
      py: '4',
      flex: '1',
      overflow: 'auto'
    },
    closeTrigger: {
      pos: 'absolute',
      top: '3',
      insetEnd: '3'
    }
  },

  variants: {
    size: {
      xs: {
        content: {
          maxW: 'xs'
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
      full: {
        content: {
          maxW: '100vw',
          h: '100dvh'
        }
      }
    },

    placement: {
      start: {
        positioner: {
          justifyContent: 'flex-start',
          alignItems: 'stretch'
        },
        content: {
          _open: {
            animationName: {
              base: 'slide-from-left-full, fade-in',
              _rtl: 'slide-from-right-full, fade-in'
            }
          },
          _closed: {
            animationName: {
              base: 'slide-to-left-full, fade-out',
              _rtl: 'slide-to-right-full, fade-out'
            }
          }
        }
      },

      end: {
        positioner: {
          justifyContent: 'flex-end',
          alignItems: 'stretch'
        },
        content: {
          _open: {
            animationName: {
              base: 'slide-from-right-full, fade-in',
              _rtl: 'slide-from-left-full, fade-in'
            }
          },
          _closed: {
            animationName: {
              base: 'slide-to-right-full, fade-out',
              _rtl: 'slide-to-left-full, fade-out'
            }
          }
        }
      },

      top: {
        positioner: {
          justifyContent: 'stretch',
          alignItems: 'flex-start'
        },
        content: {
          maxW: '100%',
          _open: { animationName: 'slide-from-top-full, fade-in' },
          _closed: { animationName: 'slide-to-top-full, fade-out' }
        }
      },

      bottom: {
        positioner: {
          justifyContent: 'stretch',
          alignItems: 'flex-end'
        },
        content: {
          maxW: '100%',
          _open: { animationName: 'slide-from-bottom-full, fade-in' },
          _closed: { animationName: 'slide-to-bottom-full, fade-out' }
        }
      }
    },

    contained: {
      true: {
        positioner: {
          padding: '4'
        },
        content: {
          borderRadius: 'md'
        }
      }
    }
  },

  defaultVariants: {
    size: 'xs',
    placement: 'end'
  }
})
