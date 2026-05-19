import { css, cx } from '../styled-system/css'
import { ButtonVariantProps, button } from '../styled-system/recipes'
import { panda } from '../styled-system/jsx'
import { SystemStyleObject } from '../styled-system/types'

const BaseButton = panda('button', button)

interface ButtonProps extends ButtonVariantProps {
  children: React.ReactNode
  css?: SystemStyleObject
}

export interface BaseButtonProps extends Omit<React.ComponentProps<typeof BaseButton>, 'children'> { 
  children?: React.ReactNode
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

export const ReusableButton = (props: BaseButtonProps) => {
  const { children, ...rest } = props

  return <BaseButton {...rest}>{children}</BaseButton>
}
