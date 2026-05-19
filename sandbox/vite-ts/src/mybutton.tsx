import { ReusableButton, type BaseButtonProps } from './Button'

export const MyButton = (props: BaseButtonProps) => {
  return (
    <ReusableButton {...props} />
  )
}

export const PageButton = (props: BaseButtonProps) => {
  const { children, size, ...rest } = props
  return (
    <ReusableButton {...rest} size={size}>
      {children}
    </ReusableButton>
  )
}

