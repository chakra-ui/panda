import { css, cx } from 'styled-system/css'
import type { ButtonVariantProps } from 'styled-system/recipes'
import { button } from 'styled-system/recipes'
import type { SystemStyleObject } from 'styled-system/types'
import type { ReactNode } from 'react'

interface ButtonProps extends ButtonVariantProps {
  children: ReactNode
  css: SystemStyleObject
}

export function Button({ children, variant, size, css: cssProp }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}
