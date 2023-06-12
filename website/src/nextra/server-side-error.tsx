import { css } from '@/styled-system/css'
import { useRouter } from 'next/router'
import { useMounted } from 'nextra/hooks'
import { getGitIssueUrl, renderComponent } from './lib'
import { Anchor } from './anchor'
import { useConfig } from './contexts'

export function ServerSideErrorPage() {
  const config = useConfig()
  const { content, labels } = config.serverSideError

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
          title: `Got server-side error in \`${
            mounted ? asPath : ''
          }\` url. Please fix!`,
          labels
        })}
        newWindow
        className={css({
          color: 'primary.600',
          textDecorationLine: 'underline',
          textDecorationThickness: 'from-font',
          textUnderlinePosition: 'from-font'
        })}
      >
        {renderComponent(content)}
      </Anchor>
    </p>
  )
}
