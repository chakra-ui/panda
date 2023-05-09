import type { ReactElement } from 'react'
import { ArrowRightIcon } from 'nextra/icons'
import { useConfig } from '../contexts'
import type { Item } from 'nextra/normalize-pages'
import { Anchor } from './anchor'
import type { DocsThemeConfig } from '../index'
import { css, cx } from '../../styled-system/css'

interface NavLinkProps {
  currentIndex: number
  flatDirectories: Item[]
}

const classes = {
  link: css({
    display: 'flex',
    maxWidth: '50%',
    alignItems: 'center',
    gap: 1,
    py: 4,
    textStyle: 'md',
    fontWeight: 'medium',
    color: 'gray.600',
    transitionProperty: 'colors',
    wordBreak: 'break-word',
    _hover: { color: 'primary.600' },
    _dark: { color: 'gray.300' },
    md: { textStyle: 'lg' }
  }),
  icon: css({ display: 'inline', height: '5', flexShrink: 0 })
}

export const NavLinks = ({
  flatDirectories,
  currentIndex
}: NavLinkProps): ReactElement | null => {
  const config = useConfig()
  const nav = config.navigation
  const navigation: Exclude<DocsThemeConfig['navigation'], boolean> =
    typeof nav === 'boolean' ? { prev: nav, next: nav } : nav
  let prev = navigation.prev && flatDirectories[currentIndex - 1]
  let next = navigation.next && flatDirectories[currentIndex + 1]

  // @ts-ignore
  if (prev && !prev.isUnderCurrentDocsTree) prev = false
  // @ts-ignore
  if (next && !next.isUnderCurrentDocsTree) next = false

  if (!prev && !next) return null

  return (
    <div
      className={css({
        mb: 8,
        display: 'flex',
        alignItems: 'center',
        borderTopWidth: '1px',
        pt: 8,
        borderTopColor: 'neutral.400',
        _dark: { borderTopColor: 'neutral.800' },
        _moreContrast: {
          borderTopColor: 'neutral.400',
          _dark: { borderTopColor: 'neutral.400' }
        },
        _print: { display: 'none' }
      })}
    >
      {prev && (
        <Anchor
          href={prev.route}
          title={prev.title}
          className={cx(
            classes.link,
            css({ _ltr: { pr: 4 }, _rtl: { pl: 4 } })
          )}
        >
          <ArrowRightIcon
            className={cx(
              classes.icon,
              css({ _ltr: { transform: 'rotate(180deg)' } })
            )}
          />
          {prev.title}
        </Anchor>
      )}
      {next && (
        <Anchor
          href={next.route}
          title={next.title}
          className={cx(
            classes.link,
            css({
              _ltr: { ml: 'auto', pl: 4, textAlign: 'right' },
              _rtl: { mr: 'auto', pr: 4, textAlign: 'left' }
            })
          )}
        >
          {next.title}
          <ArrowRightIcon
            className={cx(
              classes.icon,
              css({ _rtl: { transform: 'rotate(-180deg)' } })
            )}
          />
        </Anchor>
      )}
    </div>
  )
}
