import { css, cx } from '@/styled-system/css'
import { hstack } from '@/styled-system/patterns'
import { ArrowRightIcon } from 'nextra/icons'
import type { Item } from 'nextra/normalize-pages'
import type { DocsThemeConfig } from '../index'
import { Anchor } from './anchor'
import { useConfig } from './contexts'

interface NavLinkProps {
  currentIndex: number
  flatDirectories: Item[]
}

const styles = {
  root: hstack({
    justify: 'space-between',
    mb: '8',
    pt: '8',
    borderTopWidth: '1px'
  }),

  anchor: hstack({
    gap: '2',
    flexShrink: '0'
  }),

  icon: css({
    height: '5'
  })
}

export const NavLinks = ({ flatDirectories, currentIndex }: NavLinkProps) => {
  const config = useConfig()

  const nav = config.navigation
  const navigation: Exclude<DocsThemeConfig['navigation'], boolean> =
    typeof nav === 'boolean' ? { prev: nav, next: nav } : nav

  let prev = navigation.prev && flatDirectories[currentIndex - 1]
  let next = navigation.next && flatDirectories[currentIndex + 1]

  if (prev && !prev.isUnderCurrentDocsTree) prev = false
  if (next && !next.isUnderCurrentDocsTree) next = false

  if (!prev && !next) return null

  return (
    <div className={styles.root}>
      {prev && (
        <Anchor href={prev.route} title={prev.title} className={styles.anchor}>
          <ArrowRightIcon
            className={cx(styles.icon)}
            style={{ rotate: '180deg' }}
          />
          {prev.title}
        </Anchor>
      )}
      {next && (
        <Anchor href={next.route} className={styles.anchor} title={next.title}>
          {next.title}
          <ArrowRightIcon className={cx(styles.icon)} />
        </Anchor>
      )}
    </div>
  )
}
