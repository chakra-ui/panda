'use client'
import { DocsButtonVariantProps, docsButton } from '@/styled-system/recipes'
import NextLink, { type LinkProps } from 'next/link'
import { ButtonContent, ButtonContentProps } from './button-content'
import { cx } from '@/styled-system/css'
import { HTMLPandaProps, panda } from '@/styled-system/jsx'


export type ButtonProps = DocsButtonVariantProps &
  ButtonContentProps & { href?: LinkProps['href'] } & HTMLPandaProps<'button'> &
  HTMLPandaProps<'a'>

export const Button = (props: ButtonProps) => {
  const {
    variant,
    href,
    size,
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
          className={cx(docsButton({ variant, size }), className)}
          {...rest}
          data-scope="docsButton"
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
      className={cx(docsButton({ variant, size }), className)}
      {...rest}
      data-scope="docsButton"
      data-part="root"
    >
      <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </ButtonContent>
    </panda.button>
  )
}
