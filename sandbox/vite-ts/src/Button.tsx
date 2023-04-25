import { css, cx } from '../styled-system/css'
import { button, ButtonVariantProps } from '../styled-system/recipes'
import { SystemStyleObject } from '../styled-system/types'
import { ReactNode } from 'react'

interface ButtonProps extends ButtonVariantProps {
  children: ReactNode
  css?: SystemStyleObject
}

export function Button(props: ButtonProps) {
  const { children, ...rest } = props
  const [buttonProps, cssProps] = button.splitVariantProps(rest)
  return <button className={cx(button(buttonProps), css(cssProps))}>{children}</button>
}

export function ListedButton({ children, variant, size, css: cssProp = {} }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}

export function AnotherButtonWithRegex({ children, variant, size, css: cssProp = {} }: ButtonProps) {
  return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
}
