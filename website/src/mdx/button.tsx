import NextLink, { type LinkProps } from 'next/link'
import {
  ReactNode,
  type PropsWithChildren,
  ReactElement,
  cloneElement,
  isValidElement
} from 'react'
import { type RecipeVariantProps, cva, cx } from '@/styled-system/css'
import { HTMLPandaProps, panda } from '@/styled-system/jsx'

export const buttonStyles = cva({
  base: {
    lineHeight: '1.2',
    borderRadius: 'md',
    fontWeight: 'semibold',
    transition: 'background',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
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
        },
        _dark: {
          bg: 'whiteAlpha.200',
          color: 'gray.400',
          _hover: {
            bg: 'whiteAlpha.300',
            color: 'gray.100',
            _disabled: {
              bg: 'whiteAlpha.200'
            }
          },
          _active: {
            bg: 'whiteAlpha.400'
          }
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
        },
        _dark: {
          color: 'gray.400',
          _hover: {
            bg: 'whiteAlpha.200',
            color: 'gray.100',
            _disabled: {
              bg: 'whiteAlpha.200'
            }
          },
          _active: {
            bg: 'whiteAlpha.300'
          }
        }
      }
    },
    size: {
      lg: {
        h: 12,
        minW: 12,
        fontSize: 'lg',
        px: 6,
        gap: 2
      },
      md: {
        h: 10,
        minW: 10,
        fontSize: 'md',
        px: 4,
        gap: 2
      },
      sm: {
        h: 8,
        minW: 8,
        fontSize: 'sm',
        px: 3,
        gap: 2
      },
      xs: {
        h: 7,
        minW: 6,
        fontSize: 'xs',
        px: 2,
        gap: 2
      }
    }
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
})

export type ButtonVariants = RecipeVariantProps<typeof buttonStyles>

const ButtonIcon = (props: HTMLPandaProps<'span'>) => {
  const { children, ...rest } = props

  const _children = isValidElement(children)
    ? cloneElement(children, {
        // @ts-expect-error typings are wrong
        'aria-hidden': true,
        focusable: false
      })
    : children

  return <panda.span {...rest}>{_children}</panda.span>
}

export type ButtonContentProps = {
  children?: ReactNode | undefined
  leftIcon?: ReactElement
  rightIcon?: ReactElement
}

const ButtonContent = (props: PropsWithChildren<ButtonContentProps>) => {
  const { leftIcon, rightIcon, children } = props
  return (
    <>
      {leftIcon && <ButtonIcon>{leftIcon}</ButtonIcon>}
      {children}
      {rightIcon && <ButtonIcon>{rightIcon}</ButtonIcon>}
    </>
  )
}

export type ButtonProps = ButtonVariants &
  ButtonContentProps & { href?: LinkProps['href'] } & HTMLPandaProps<'button'> &
  HTMLPandaProps<'a'>

export const Button = (props: ButtonProps) => {
  const {
    variant,
    size,
    href,
    leftIcon,
    rightIcon,
    children,
    className,
    ...rest
  } = props

  if (href) {
    return (
      <NextLink legacyBehavior href={href} passHref>
        <panda.a
          className={cx(buttonStyles({ variant, size }), className)}
          {...rest}
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
      className={cx(buttonStyles({ variant, size }), className)}
      {...rest}
    >
      <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </ButtonContent>
    </panda.button>
  )
}
