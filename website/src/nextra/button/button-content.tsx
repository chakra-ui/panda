import { ReactNode, type PropsWithChildren, ReactElement } from 'react'
import { ButtonIcon } from './button-icon'

export type ButtonContentProps = {
  children?: ReactNode | undefined
  leftIcon?: ReactElement
  rightIcon?: ReactElement
}

export const ButtonContent = (props: PropsWithChildren<ButtonContentProps>) => {
  const { leftIcon, rightIcon, children } = props
  return (
    <>
      {leftIcon && <ButtonIcon>{leftIcon}</ButtonIcon>}
      {children}
      {rightIcon && (
        <ButtonIcon>{rightIcon}</ButtonIcon>
      )}
    </>
  )
}
