import { css, cva } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createContext, useContext, useId } from 'react'

/* -----------------------------------------------------------------------------
 * Context Setup
 * -----------------------------------------------------------------------------*/

interface ContextType {
  value: string
  isActive(value: string): boolean
  getValue(index: number): string
  values: Array<string>
  rootId: string
}

const RouteSwitchContext = createContext({} as ContextType)

const RouteSwitchProvider = RouteSwitchContext.Provider

const useRouteSwitch = () => {
  const context = useContext(RouteSwitchContext)
  if (!context) {
    throw new Error('RouteSwitch parts are not inside a RouteSwitch')
  }
  return context
}

/* -----------------------------------------------------------------------------
 * Route Switch
 * -----------------------------------------------------------------------------*/

export interface RouteSwitchProps {
  children: React.ReactNode
  values: string[]
}

export const RouteSwitch = (props: RouteSwitchProps) => {
  const { children, values } = props
  const rootId = useId()
  const value = (useRouter().query.value as string) || values[0]
  return (
    <RouteSwitchProvider
      value={{
        value,
        values,
        rootId,
        isActive: view => value === view,
        getValue: index => values[index]
      }}
    >
      {children}
    </RouteSwitchProvider>
  )
}

/* -----------------------------------------------------------------------------
 * Route Switch - Link
 * -----------------------------------------------------------------------------*/

const linkStyles = cva({
  base: {
    flex: '1',
    textAlign: 'center',
    px: '1',
    py: '2',
    cursor: 'pointer',
    rounded: 'md',
    fontWeight: 'medium'
  },
  variants: {
    selected: {
      true: {
        bg: 'yellow.300',
        color: 'gray.800'
      },
      false: {
        _hover: {
          bg: { base: 'gray.200', _dark: 'neutral.800' }
        }
      }
    }
  }
})

const RouteSwitchLink = (props: {
  value: string
  children: React.ReactNode
}) => {
  const { value, children } = props
  const router = useRouter()
  const { isActive, rootId } = useRouteSwitch()
  const active = isActive(value)

  return (
    <Link
      href={{
        pathname: router.pathname,
        query: router.isReady ? { value } : undefined,
        hash: router.isReady ? router.asPath.split('#')[1] : undefined
      }}
      scroll={false}
      aria-selected={active ? true : undefined}
      role="tab"
      tabIndex={active ? 0 : -1}
      id={`tab-${rootId}-${value}`}
      className={linkStyles({ selected: active })}
    >
      {children}
    </Link>
  )
}

/* -----------------------------------------------------------------------------
 * Route Switch - Trigger
 * -----------------------------------------------------------------------------*/

const triggerStyles = flex({
  mt: '4',
  p: '1',
  gap: '1',
  w: 'full',
  rounded: 'md',
  justify: 'stretch',
  bg: { base: 'gray.100', _dark: 'neutral.700' }
})

type TriggerProps = {
  values: string[]
}

export const RouteSwitchTrigger = (props: TriggerProps) => {
  const { values } = props
  const { getValue } = useRouteSwitch()
  return (
    <div className={triggerStyles}>
      {values.map((item, index) => (
        <RouteSwitchLink value={getValue(index)} key={item}>
          {item}
        </RouteSwitchLink>
      ))}
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * Route Switch - Content
 * -----------------------------------------------------------------------------*/

export interface ContentProps {
  value: string
  children: React.ReactNode
}

export const RouteSwitchContent = (props: ContentProps) => {
  const { value, children } = props
  const { rootId, isActive } = useRouteSwitch()
  const isHidden = !isActive(value)

  return (
    <div
      className={css({ mt: '5' })}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`tab-${rootId}-${value}`}
      hidden={isHidden}
    >
      {children}
    </div>
  )
}
