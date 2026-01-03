import { css } from 'styled-system/css'
import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
}

export const Button = ({ children }: ButtonProps) => {
  return (
    <button
      className={css({
        bg: 'red.300',
        fontFamily: 'Inter',
        px: '4',
        py: '3',
        borderRadius: 'md',
        _hover: { bg: 'red.400' },
      })}
    >
      {children}
    </button>
  )
}

