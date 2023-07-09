import { cx, cva } from '@/styled-system/css'
import { ReactElement, ReactNode } from 'react'
import { forwardRef } from 'react'

const sidebarContainerStyles = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    smDown: {
      _motionReduce: {
        transition: 'none'
      },
      position: 'fixed',
      pt: 'var(--nextra-navbar-height)',
      top: 0,
      bottom: 0,
      w: '100%',
      zIndex: 15,
      overscrollBehavior: 'contain',
      bg: { base: 'white', _dark: 'dark' },
      transition: 'transform 0.8s cubic-bezier(0.52, 0.16, 0.04, 1)',
      willChange: 'transform, opacity',
      contain: 'layout style',
      backfaceVisibility: 'hidden',
      '& > .nextra-scrollbar': {
        maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
      }
    },
    sm: {
      top: 16,
      flexShrink: 0,
      '& > .nextra-scrollbar': {
        maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
      }
    },
    transform: 'translate3d(0,0,0)',
    transition: 'all',
    _print: {
      display: 'none'
    }
  },
  variants: {
    showSidebar: {
      true: {
        md: { w: 64 }
      },
      false: {
        md: { w: 20 }
      }
    },
    isPopover: {
      true: {
        md: {
          display: 'none'
        }
      },
      false: {
        position: 'sticky',
        alignSelf: {
          base: 'stretch',
          md: 'flex-start'
        }
      }
    },
    isMobileMenuOpen: {
      true: {
        smDown: {
          transform: 'translate3d(0,0,0)'
        }
      },
      false: {
        smDown: {
          transform: 'translate3d(-100%,0,0)'
        }
      }
    }
  }
})

export interface ISidebarContainerProps {
  showSidebar?: boolean
  isPopover?: boolean
  isMobileMenuOpen?: boolean
  className?: string
  children?: ReactNode
}

export const SidebarContainer = forwardRef<
  HTMLDivElement,
  ISidebarContainerProps
>(
  (
    { showSidebar, isPopover, isMobileMenuOpen, className, ...rest },
    ref
  ): ReactElement => (
    <aside
      className={cx(
        sidebarContainerStyles({
          showSidebar,
          isPopover,
          isMobileMenuOpen
        }),
        className
      )}
      {...rest}
      ref={ref}
    />
  )
)

if (process.env.NODE_ENV === 'development') {
  SidebarContainer.displayName = 'SidebarContainer'
}
