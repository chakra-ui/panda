import { css } from '@/styled-system/css'
import { FC } from 'react'

export const SidebarPlaceholder: FC = () => (
  <div
    className={css({
      xl: { display: 'none' },
      h: 0,
      w: 64,
      flexShrink: 0
    })}
  />
)
