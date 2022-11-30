import { navItems } from '../utils/constants'
import { NavLink } from 'react-router-dom'
import { panda, Stack, Wrap } from 'design-system/jsx'
import { css } from 'design-system/css'

function Item(props: typeof navItems[number]) {
  return (
    <NavLink key={props.id} to={`/${props.id}`}>
      <Stack
        gap="0"
        width="60"
        background="var(--aside-bg)"
        borderRadius="sm"
        padding="4"
        transition="all 0.2s ease"
        hover={{
          boxShadow: 'lg',
        }}
        osLight={{ color: '#3b3b3b', background: '#bababa3d' }}
      >
        <panda.span
          css={{
            '& svg': {
              fontWeight: 'normal',
              fontSize: 'xx-large',
              marginBottom: '6',
              height: '6',
              width: '6',
            },
          }}
        >
          <props.icon />
        </panda.span>
        <panda.span display="block" fontWeight="semibold" fontSize="small">
          {props.label}
        </panda.span>
        <panda.span display="block" marginTop="3">
          {props.description}
        </panda.span>
      </Stack>
    </NavLink>
  )
}

function Index() {
  return (
    <panda.div display="flex" flexDir="column">
      <panda.span fontWeight="bold" fontSize="2xl" paddingX="8" paddingY="4">
        🐼 Panda
      </panda.span>
      <panda.div
        paddingX="8"
        paddingY="24"
        marginBottom="10"
        background="#1a1a1a"
        osLight={{
          background: '#bababa3d',
        }}
      >
        <panda.span display="block" fontSize="3xl" fontWeight="semibold" marginBottom="6">
          Design System
        </panda.span>
        <panda.span display="block">Build great products, faster.</panda.span>
        <NavLink
          to="/colors"
          className={css({
            background: '#646cff',
            color: 'white',
            width: 'fit-content',
            fontSize: 'small',
            fontWeight: 'semibold',
            paddingX: '6',
            paddingY: '1',
            borderRadius: 'sm',
            marginTop: '6',
            transition: 'all 0.2s ease',
            display: 'block',
            '&:hover': {
              background: '#4049f0',
              boxShadow: 'lg',
            },
          })}
        >
          Explore
        </NavLink>
      </panda.div>
      <Wrap gap="6" padding="8" marginY="2">
        <div>
          <panda.span display="block">TOKENS</panda.span>
          <Wrap marginY="2" padding="0" gap="6">
            {navItems
              .filter((k) => k.type === 'token')
              .map((themeKey) => (
                <Item key={themeKey.id} {...themeKey} />
              ))}
          </Wrap>
        </div>
        <div>
          <panda.span display="block">PLAYGROUND</panda.span>
          <Wrap marginY="2" padding="0" gap="6">
            {navItems
              .filter((k) => k.type === 'playground')
              .map((themeKey) => (
                <Item key={themeKey.id} {...themeKey} />
              ))}
          </Wrap>
        </div>
      </Wrap>
    </panda.div>
  )
}

export default Index
