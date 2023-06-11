import { forwardRef } from 'react'
import { css } from '@/styled-system/css'

const DEFAULT_ID = 'reach-skip-nav'
const DEFAULT_LABEL = 'Skip to content'

type SkipNavLinkProps = Omit<
  React.ComponentProps<'a'>,
  'ref' | 'href' | 'children'
> & {
  label?: string
  styled?: boolean
}

export const SkipNavLink = forwardRef<HTMLAnchorElement, SkipNavLinkProps>(
  function (
    {
      className: providedClassName,
      id,
      label = DEFAULT_LABEL,
      styled,
      ...props
    },
    forwardedRef
  ) {
    const className =
      providedClassName === undefined // Give the option to the user to pass a falsy other than undefined to remove the default styles
        ? styled // Give the user a way to opt-in the default style provided with the theme. Probably remove this option in the next major version (v3.x) and just do a check to use the providedClassName or the default
          ? css({
              srOnly: true,
              _focus: {
                position: 'fixed',
                srOnly: false,
                zIndex: 50,
                m: 3,
                ml: 4,
                h: 'calc(var(--nextra-navbar-height) - 1.5rem)',
                rounded: 'lg',
                border: '1px',
                py: 2,
                verticalAlign: 'middle',
                fontSize: 'sm',
                fontWeight: 'bold',
                color: 'gray.900',
                bg: 'white',
                borderColor: 'neutral.400',
                _dark: {
                  color: 'gray.100',
                  bg: 'neutral.900',
                  borderColor: 'neutral.800'
                }
              }
            })
          : ''
        : providedClassName

    return (
      <a
        {...props}
        ref={forwardedRef}
        href={`#${id || DEFAULT_ID}`}
        className={className}
        data-reach-skip-link=""
      >
        {label}
      </a>
    )
  }
)

SkipNavLink.displayName = 'SkipNavLink'

type SkipNavContentProps = Omit<React.ComponentProps<'div'>, 'ref' | 'children'>

export const SkipNavContent = forwardRef<HTMLDivElement, SkipNavContentProps>(
  function ({ id, ...props }, forwardedRef) {
    return <div {...props} ref={forwardedRef} id={id || DEFAULT_ID} />
  }
)

SkipNavContent.displayName = 'SkipNavContent'
