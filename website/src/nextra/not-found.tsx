import { css } from '@/styled-system/css'
import { useRouter } from 'next/router'
import { useMounted } from 'nextra/hooks'
import { getGitIssueUrl, renderComponent } from './lib'
import { Anchor } from './anchor'
import { useConfig } from './contexts'

export function NotFoundPage() {
  const config = useConfig()
  const { content, labels } = config.notFound

  const mounted = useMounted()
  const { asPath } = useRouter()

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
