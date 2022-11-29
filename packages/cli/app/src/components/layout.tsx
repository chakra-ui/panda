import { navItems } from '../utils/constants'
import { NavLink } from 'react-router-dom'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

type LayoutProps = { children: React.ReactNode }

function Item(props: typeof navItems[number]) {
  return (
    <NavLink key={props.id} to={`/${props.id}`}>
      {({ isActive }) => (
        <panda.li
          padding="0.3rem 0"
          cursor="pointer"
          fontSize="0.9rem"
          fontWeight={600}
          transition="all 0.2s ease"
          data-active={isActive ? '' : undefined}
          css={{
            '&:hover, &[data-active]': {
              color: '#9499ff',
            },
          }}
        >
          {props.label}
        </panda.li>
      )}
    </NavLink>
  )
}

export function Layout(props: LayoutProps) {
  const { children } = props

  return (
    <panda.main
      display="flex"
      height="calc(100vh - env(safe-area-inset-bottom))"
      css={{
        '&>*': {
          padding: '2rem 1rem',
          overflow: 'auto',
        },
      }}
    >
      <panda.aside
        display="flex"
        flexDirection="column"
        height="full"
        minW="15rem"
        background="var(--aside-bg)"
        osLight={{
          color: 'white',
        }}
      >
        <NavLink to="/" className={css({ fontWeight: 700, fontSize: '1.4rem' })}>
          🐼 Panda
        </NavLink>
        <panda.div
          marginTop="2rem"
          css={{
            '&>span': {
              fontWeight: 700,
              fontSize: 'small',
              opacity: 0.7,
            },
            '&>ul': {
              listStyleType: 'none',
              padding: 0,
              margin: '0.5rem 0',
            },
          }}
        >
          <span>TOKENS</span>
          <panda.ul marginBottom="2rem">
            {navItems
              .filter((k) => k.type === 'token')
              .map((themeKey) => (
                <Item key={themeKey.id} {...themeKey} />
              ))}
          </panda.ul>
          <span>PLAYGROUND</span>
          <ul>
            {navItems
              .filter((k) => k.type === 'playground')
              .map((themeKey) => (
                <Item key={themeKey.id} {...themeKey} />
              ))}
          </ul>
        </panda.div>
      </panda.aside>
      <panda.div width="full">{children}</panda.div>
      <panda.div
        position="fixed"
        right="2rem"
        fontSize="0.8rem"
        bottom="calc(env(safe-area-inset-bottom) + 1rem)"
        background="#000"
        borderRadius="8px"
        padding="4px 10px"
        pointerEvents="none"
        color="white"
      >
        🐼 Made with Panda
      </panda.div>
    </panda.main>
  )
}
