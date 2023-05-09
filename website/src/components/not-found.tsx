import type { ReactElement } from 'react'
import { useMounted } from 'nextra/hooks'
import { useConfig } from '../contexts'
import { renderComponent, getGitIssueUrl } from '../utils'
import { useRouter } from 'next/router'
import { Anchor } from './anchor'
import { css } from '../../styled-system/css'

export function NotFoundPage(): ReactElement | null {
  const config = useConfig()
  const mounted = useMounted()
  const { asPath } = useRouter()
  const { content, labels } = config.notFound
  if (!content) {
    return null
  }

  return (
    <p className={css({ textAlign: 'center' })}>
      <Anchor
        href={getGitIssueUrl({
          repository: config.docsRepositoryBase,
          title: `Found broken \`${mounted ? asPath : ''}\` link. Please fix!`,
          labels
        })}
        newWindow
        className={css({
          color: 'primary.600',
          textDecoration: 'from-font',
          textUnderlinePosition: 'from-font'
        })}
      >
        {renderComponent(content)}
      </Anchor>
    </p>
  )
}
