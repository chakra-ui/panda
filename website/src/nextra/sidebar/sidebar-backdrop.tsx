import { css } from '@/styled-system/css'
import { FC } from 'react'

const sidebarBackdropOpenStyles = css({
  position: 'fixed',
  inset: 0,
  zIndex: 10,
  backgroundColor: 'blackAlpha.600'
})

const sidebarBackdropClosedStyles = css({
  backgroundColor: 'transparent'
})

export interface ISidebarBackdrop {
  isMobileMenuOpen?: boolean
  onClick?: () => void
}

export const SidebarBackdrop: FC<ISidebarBackdrop> = ({
  isMobileMenuOpen,
  ...rest
}) => (
  <div
    className={
      isMobileMenuOpen ? sidebarBackdropOpenStyles : sidebarBackdropClosedStyles
    }
    {...rest}
  />
)
