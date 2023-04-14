import { css, cx } from '../design-system/css'
import { button, ButtonVariants } from '../design-system/recipes'
import { SystemStyleObject } from '../design-system/types'
import { ReactNode } from 'react'

interface ButtonProps extends ButtonVariants {
  children: ReactNode
  css?: SystemStyleObject
}

export function Button({ children, variant, size, css: cssProp = {} }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}

export function ListedButton({ children, variant, size, css: cssProp = {} }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}

export function AnotherButtonWithRegex({ children, variant, size, css: cssProp = {} }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}
