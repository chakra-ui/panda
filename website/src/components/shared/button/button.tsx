'use client'
import { panda, type HTMLPandaProps } from '@/styled-system/jsx'
import { cva, type RecipeVariantProps } from '@/styled-system/css'
import NextLink, { type LinkProps } from 'next/link'
import { ButtonContent, ButtonContentProps } from './button-content'

export const buttonStyle = cva({
  base: {
    lineHeight: '1.2',
    borderRadius: 'md',
    fontWeight: 'semibold',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    _focusVisible: {
      boxShadow: 'outline'
    },
    _disabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
      boxShadow: 'none'
    },
    _hover: {
      _disabled: {
        bg: 'initial'
      }
    }
  },
  variants: {
    variant: {
      solid: {
        bg: 'gray.100',
        color: 'gray.800',
        _hover: {
          bg: 'gray.200',
          _disabled: {
            bg: 'gray.100'
          }
        },
        _active: {
          bg: 'gray.300'
        }
      },
      ghost: {
        bg: 'transparent',
        color: 'gray.800',
        _hover: {
          bg: 'gray.100',
          _disabled: {
            bg: 'gray.100'
          }
        },
        _active: {
          bg: 'gray.200'
        }
      },
      outline: {},
      link: {},
      unstyled: {}
    },
    color: {
      yellow: {},
      gray: {}
    },
    size: {
      lg: {
        h: '12',
        minW: '12',
        fontSize: 'lg',
        px: '6'
      },
      md: {
        h: '10',
        minW: '10',
        fontSize: 'md',
        px: '4'
      },
      sm: {
        h: '8',
        minW: '8',
        fontSize: 'sm',
        px: '3'
      },
      xs: {
        h: '7',
        minW: '6',
        fontSize: 'xs',
        px: '2'
      }
    }
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
})

export type ButtonVariants = RecipeVariantProps<typeof buttonStyle>

export type ButtonProps = ButtonVariants &
  ButtonContentProps & { href?: LinkProps['href'] } & HTMLPandaProps<'button'> &
  HTMLPandaProps<'a'>

export const Button = (props: ButtonProps) => {
  const { variant, href, size, leftIcon, rightIcon, children, ...rest } = props

  if (href) {
    return (
      <NextLink legacyBehavior href={href} passHref>
        <panda.a
          {...rest}
          className={buttonStyle({ variant, size })}
          data-scope="button"
          data-part="root"
        >
          <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
            {children}
          </ButtonContent>
        </panda.a>
      </NextLink>
    )
  }

  return (
    <panda.button
      {...rest}
      className={buttonStyle({ variant, size })}
      data-scope="button"
      data-part="root"
    >
      <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </ButtonContent>
    </panda.button>
  )
}
