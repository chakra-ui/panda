import { FC, ReactNode } from 'react'
import { Flex } from '../../styled-system/jsx'
import { button } from '../../styled-system/recipes'
import { css } from '../../styled-system/css'
import { useRouter } from 'next/router'
import Link from 'next/link'

export interface IContextSelectProps {
  contexts: Array<string>
}

export const ContextSelect: FC<IContextSelectProps> = ({ contexts }) => {
  const router = useRouter()

  return (
    <Flex gap="4" w="full" justify={"stretch"}  >
      {contexts.map(context => (
        <Link
          key={context}
          href={{
            pathname: router.pathname,
            query: { context },
            hash: router.asPath.split('#')[1]
          }}
          className={['nextra-context-select', button({ color: 'yellow'}), css({ flex: 1 })].join(' ')}
        >
          {context}
        </Link>
      ))}
    </Flex>
  )
}

export interface IContextSelectProps {
  name: string
  children: ReactNode
}

export const ContextSelectPanel: FC<IContextSelectProps> = ({
  name,
  children
}) => {
  const router = useRouter()
  const context = router.query.context as string

  if (context === name) {
    return <>{children}</>
  }

  return null
}
