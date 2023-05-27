import { FC, ReactNode, createContext, useContext } from 'react'
import { Flex, FlexProps } from '../../styled-system/jsx'
import { css } from '../../styled-system/css'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface IContextSelectContext {
  activeContext: string;
  contexts: Array<string>;
}

const ContextSelectContext = createContext<IContextSelectContext>({
  activeContext: '',
  contexts: []
});

const ContextSelectProvider = ContextSelectContext.Provider;

const useContextSelect = () => {
  const context = useContext(ContextSelectContext);

  if (!context) {
    throw new Error('ContextSelect parts are not inside a ContextSelect')
  }

  return context;
}

export interface IContextSelectProps {
  children: ReactNode;
  contexts: Array<string>;
}

export const ContextSelect: FC<IContextSelectProps> = ({ children, contexts }) => {
  const activeContext = useRouter().query.context as string || contexts[0];

  return (
    <ContextSelectProvider value={{
      activeContext,
      contexts
    }}>
      {children}
    </ContextSelectProvider>
  )
}

interface IContextSelectLinkProps {
  context: string
}

const ContextSelectLink: FC<IContextSelectLinkProps> = ({ context }) => {
  const router = useRouter()
  const { activeContext } = useContextSelect();
  const isActive = activeContext === context;

  return (
    <Link
      href={{
        pathname: router.pathname,
        query: router.isReady ? { context } : undefined,
        hash: router.isReady ? router.asPath.split('#')[1] : undefined
      }}
      scroll={false}
      data-active={isActive ? true : undefined}
      className={[
        'nextra-context-select-link',
        css({
          flex: 1,
          textAlign: 'center',
          p: 1,
          cursor: 'pointer',
          borderRadius: 'md',
          _hover: {
            bg: 'gray.200'
          },
          '&[data-active]': {
            bg: 'yellow.300',
            color: 'black',
            fontWeight: 'bold',
            borderRadius: 'md'
          }
        })
      ].join(' ')}
    >
      {context}
    </Link>
  )
}


export const ContextSelectOptions: FC<FlexProps> = (props) => {
  const { contexts } = useContextSelect();

  return (
    <Flex
      className="nextra-context-select"
      gap={1}
      w="full"
      justify={'stretch'}
      bg="gray.100"
      borderRadius="md"
      p={1}
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
  const { contexts, activeContext } = useContextSelect();
  const context = contexts[index];

  if (context === activeContext) {
    return <>{children}</>
  }

  return null
}
