import { cva } from '@/styled-system/css'
import { FC } from 'react'

const sidebarBackdropStyles = cva({
  base: {
    position: 'fixed',
    inset: 0,
    zIndex: 10,
    backgroundColor: 'blackAlpha.600',
    transition: 'opacity 0.8s ease-in-out',
    opacity: 0,
    pointerEvents: 'none',
    md: {
      display: 'none'
    }
  },
  variants: {
    isOpen: {
      true: {
        opacity: 1,
        pointerEvents: 'auto',

      },
      false: {
        opacity: 0,
        pointerEvents: 'none'
      }
    }
  }
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
    className={sidebarBackdropStyles({ isOpen: isMobileMenuOpen })}
    {...rest}
  />
)
