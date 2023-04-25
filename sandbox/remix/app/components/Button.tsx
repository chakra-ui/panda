import { css, cx } from 'styled-system/css'
import { button, ButtonVariants } from 'styled-system/recipes'
import { SystemStyleObject } from 'styled-system/types'
import { ReactNode } from 'react'

interface ButtonProps extends ButtonVariants {
  children: ReactNode
  css: SystemStyleObject
}

export function Button({ children, variant, size, css: cssProp }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}
