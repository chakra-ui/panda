import { cva, cx } from '@/styled-system/css'
import type { ReactNode } from 'react'

const styles = cva({
  base: {
    position: 'relative',
    mx: { base: '-6', md: '-8', '2xl': '-24' },
    mt: '-6'
  },
  variants: {
    full: {
      true: {
        ms: { xl: 'calc(50% - 50vw + 16rem)' },
        me: { xl: 'calc(50% - 50vw)' }
      }
    }
  }
})

type Props = {
  full: boolean
  children: ReactNode
}

export const Bleed = ({ full, children }: Props) => {
  return <div className={cx('nextra-bleed', styles({ full }))}>{children}</div>
}
