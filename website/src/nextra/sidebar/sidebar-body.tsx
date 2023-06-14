import { css, cx } from '@/styled-system/css'
import { ReactNode, forwardRef } from 'react'

const sidebarBodyStyles = css({
  overflowY: 'auto',
  overflowX: 'hidden',
  px: '4',
  py: '4',
  flexGrow: 1,
  md: {
    h: 'calc(100vh - var(--nextra-navbar-height) - var(--nextra-menu-height))'
  }
})

export interface ISidebarBodyProps {
  children?: ReactNode
  showSidebar?: boolean
}

export const SidebarBody = forwardRef<HTMLDivElement, ISidebarBodyProps>(
  ({ children, showSidebar }, ref) => (
    <div
      className={cx(
        sidebarBodyStyles,
        showSidebar ? 'nextra-scrollbar' : 'no-scrollbar'
      )}
      ref={ref}
    >
      {children}
    </div>
  )
)

if (process.env.NODE_ENV === 'development') {
  SidebarBody.displayName = 'SidebarBody'
}
