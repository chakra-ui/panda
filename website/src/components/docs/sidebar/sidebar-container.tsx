import { cx, css } from '@/styled-system/css'
import { panda } from '@/styled-system/jsx'
import { ReactElement, ReactNode } from 'react'
import { forwardRef } from 'react'

const sidebarContainer = css({
  display: 'flex',
  flexDirection: 'column',
  mdDown: {
    _motionReduce: {
      transitionProperty: 'none'
    },
    position: 'fixed',
    pt: 'var(--nextra-navbar-height)',
    top: 0,
    bottom: 0,
    w: '100%',
    zIndex: 15,
    overscrollBehavior: 'contain',
    backgroundColor: 'white',
    _dark: {
      backgroundColor: 'dark'
    },
    transition: 'transform 0.8s cubic-bezier(0.52, 0.16, 0.04, 1)',
    willChange: 'transform, opacity',
    contain: 'layout style',
    backfaceVisibility: 'hidden',
    '& > .nextra-scrollbar': {
      maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
    }
  },
  md: {
    top: 16,
    flexShrink: 0,
    '& > .nextra-scrollbar': {
      maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
    }
  },
  _motionReduce: {
    transform: 'none'
  },
  transform: 'translate3d(0,0,0)',
  transitionProperty: 'all',
  transition: 'ease-in-out',
  _print: {
    display: 'none'
  },
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
    <panda.aside
      className={cx(
        sidebarContainer,
        showSidebar ? css({ md: { w: 64 } }) : css({ md: { w: 20 } }),
        isPopover
          ? css({ md: { display: 'none' } })
          : css({
              position: 'sticky',
              alignSelf: { base: 'stretch', md: 'flex-start' }
            }),
        isMobileMenuOpen
          ? css({ mdDown: { transform: 'translate3d(0,0,0)' } })
          : css({ mdDown: { transform: 'translate3d(-100%,0,0)' } }),
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
