import { css } from '@/styled-system/css'
import { FC, ReactNode } from 'react'

export interface ISidebarHeaderProps {
  children?: ReactNode
}

export const SidebarHeader: FC<ISidebarHeaderProps> = ({ children }) => (
  <div className={css({ px: 4, pt: 4, md: { display: 'none' } })}>
    {children}
  </div>
)
