import { FC, ReactNode, createContext, useContext, useId } from 'react'
import { Flex, FlexProps } from '../../styled-system/jsx'
import { css } from '../../styled-system/css'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface IContextSelectContext {
  activeContext: string
  contexts: Array<string>
  rootId: string
}

const ContextSelectContext = createContext<IContextSelectContext>({
  activeContext: '',
  contexts: [],
  rootId: ''
})

const ContextSelectProvider = ContextSelectContext.Provider

const useContextSelect = () => {
  const context = useContext(ContextSelectContext)

  if (!context) {
    throw new Error('ContextSelect parts are not inside a ContextSelect')
  }

  return context
}

export interface IContextSelectProps {
  children: ReactNode
  contexts: Array<string>
}

export const ContextSelect: FC<IContextSelectProps> = ({
  children,
  contexts
}) => {
  const rootId = useId()
  const activeContext = (useRouter().query.context as string) || contexts[0]

  return (
    <ContextSelectProvider
      value={{
        activeContext,
        contexts,
        rootId
      }}
    >
      {children}
    </ContextSelectProvider>
  )
}

interface IContextSelectLinkProps {
  context: string
}

const ContextSelectLink: FC<IContextSelectLinkProps> = ({ context }) => {
  const router = useRouter()
  const { activeContext, rootId } = useContextSelect()
  const isActive = activeContext === context

  return (
    <Link
      href={{
        pathname: router.pathname,
        query: router.isReady ? { context } : undefined,
        hash: router.isReady ? router.asPath.split('#')[1] : undefined
      }}
      scroll={false}
      aria-selected={isActive ? true : undefined}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      id={`tab-${rootId}-${context}`}
      className={css({
        flex: 1,
        textAlign: 'center',
        px: '1',
        py: '2',
        cursor: 'pointer',
        borderRadius: 'md',
        fontWeight: 'medium',
        _hover: { bg: 'gray.200' },
        _dark: {
          _hover: { bg: 'neutral.600' }
        },
        '&[aria-selected]': {
          bg: 'yellow.300',
          color: 'black',
          borderRadius: 'md',
          _dark: {
            bg: 'yellow.300',
            color: 'black'
          }
        }
      })}
    >
      {context}
    </Link>
  )
}

export const ContextSelectOptions: FC<FlexProps> = props => {
  const { contexts } = useContextSelect()

  return (
    <Flex
      mt="4"
      className="nextra-context-select"
      gap={1}
      w="full"
      justify={'stretch'}
      bg="gray.100"
      borderRadius="md"
      p={1}
      _dark={{
        bg: 'neutral.700'
      }}
      {...props}
    >
      {contexts.map(context => (
        <ContextSelectLink key={context} context={context} />
      ))}
    </Flex>
  )
}

export interface IContextSelectProps {
  index: number
  children: ReactNode
}

export const ContextSelectPanel: FC<IContextSelectProps> = ({
  index,
  children
}) => {
  const { contexts, activeContext, rootId } = useContextSelect()
  const context = contexts[index]
  const isHidden = context !== activeContext

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`tab-${rootId}-${context}`}
      hidden={isHidden}
    >
      {children}
    </div>
  )
}
