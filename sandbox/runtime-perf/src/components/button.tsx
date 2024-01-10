import { ComponentProps, forwardRef } from 'react'
import { RecipeVariantProps, cva } from '../../styled-system/css'

export const styles = cva({
  base: {
    borderRadius: 'md',
    fontWeight: 'bold',
    fontFamily: 'sans',
  },
  variants: {
    disabled: {
      true: {},
      false: {},
    },
    size: {
      sm: {
        paddingX: 'xs',
        paddingY: 'xxs',
      },
      md: {
        paddingX: 'sm',
        paddingY: 'xs',
      },
      lg: {
        paddingX: 'md',
        paddingY: 'sm',
      },
    },
    tone: {
      brand: {
        backgroundColor: 'blue600',
        borderWidth: '0',
        color: 'white',
      },
      critical: {
        backgroundColor: 'red600',
        borderWidth: '0',
        color: 'white',
      },
      neutral: {
        backgroundColor: 'white',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'gray400',
        color: 'gray800',
      },
    },
  },
  defaultVariants: {
    disabled: false,
    size: 'md',
    tone: 'brand',
  },
})

export const Button = forwardRef<HTMLButtonElement, ComponentProps<'button'> & RecipeVariantProps<typeof styles>>(
  (props, forwardedRef) => {
    const { disabled, size, tone } = props
    return <button ref={forwardedRef} className={styles({ disabled, size, tone })} {...props} />
  },
)

Button.displayName = 'Button'
