import { css, cx } from '@/styled-system/css'
import { FC, ReactNode } from 'react'

export interface ISidebarFooterProps {
  children?: ReactNode
  showSidebar: boolean
  hasI18n: boolean
  showToggleAnimation: boolean
}

export const SidebarFooter: FC<ISidebarFooterProps> = ({
  showSidebar,
  hasI18n,
  showToggleAnimation,
  ...rest
}) => (
  <div
    data-toggle-animation={
      showToggleAnimation ? (showSidebar ? 'show' : 'hide') : 'off'
    }
    className={cx(
      css({
        position: 'sticky',
        bottom: 0,
        bg: 'white',
        _dark: {
          // when banner is showed, sidebar links can be behind menu, set bg color as body bg color
          bg: 'dark',
          borderColor: 'neutral.800',
          shadow: '0 0 #0000, 0 0 #0000, 0 -12px 16px #111'
        },
        mx: 4,
        py: 4,
        shadow: '0 0 #0000, 0 0 #0000, 0 -12px 16px #fff',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        _moreContrast: {
          bg: 'neutral.400',
          shadow: 'none',
          _dark: {
            shadow: 'none'
          }
        },
        "&[data-toggle-animation='show'] button": {
          opacity: 0,
          animation: 'fadein 1s ease 0.2s forwards'
        },
        "&[data-toggle-animation='hide'] button": {
          opacity: 0,
          animation: 'fadein2 1s ease 0.2s forwards'
        }
      }),
      showSidebar
        ? cx(
            hasI18n && css({ justifyContent: 'flex-end' }),
            css({ borderTopWidth: '1px' })
          )
        : css({ py: 4, flexWrap: 'wrap', justifyContent: 'center' })
    )}
    {...rest}
  />
)
