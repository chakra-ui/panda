import { navItems } from '../utils/constants'
import { NavLink } from 'react-router-dom'
import { panda } from 'design-system/jsx'

function Item(props: typeof navItems[number]) {
  return (
    <NavLink key={props.id} to={`/${props.id}`}>
      <panda.li
        width="220px"
        background="var(--aside-bg)"
        borderRadius="8px"
        padding="18px"
        transition="all 0.2s ease"
        display="flex"
        flexDir="column"
        hover={{
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
        osLight={{ color: '#3b3b3b', background: '#bababa3d' }}
      >
        <panda.span
          css={{
            '& svg': {
              fontWeight: 400,
              fontSize: 'xx-large',
              marginBottom: '24px',
              height: '24px',
              width: '24px',
            },
          }}
        >
          <props.icon />
        </panda.span>
        <panda.span display="block" fontWeight={600} fontSize="small">
          {props.label}
        </panda.span>
        <panda.span display="block" marginTop="12px">
          {props.description}
        </panda.span>
      </panda.li>
    </NavLink>
  )
}

function Index() {
  return (
    <panda.div display="flex" flexDir="column">
      <panda.span fontWeight={700} fontSize="1.4rem" padding="1em 2rem">
        🐼 Panda
      </panda.span>
      <panda.div
        padding="6em 2rem"
        marginBottom="40px"
        background="#1a1a1a"
        css={{
          '& span': { display: 'block' },
        }}
        osLight={{
          background: '#bababa3d',
        }}
      >
        <panda.span fontSize="1.7em" fontWeight={600} marginBottom="24px">
          Design System
        </panda.span>
        <span>Build great products, faster.</span>
        <NavLink
          to="/colors"
          css={{
            background: '#646cff',
            color: 'white',
            width: 'fit-content',
            fontSize: 'small',
            fontWeight: '600',
            padding: '4px 24px',
            borderRadius: '4px',
            marginTop: '24px',
            transition: 'all 0.2s ease',
            display: 'block',
            '&:hover': {
              background: '#4049f0',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          Explore
        </NavLink>
      </panda.div>
      <panda.div
        display="flex"
        flexDir="column"
        gap="24px"
        padding="2rem"
        css={{
          listStyleType: 'none',
          padding: '0',
          margin: '0.5rem 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <span>TOKENS</span>
          <panda.ul
            css={{
              listStyleType: 'none',
              padding: 0,
              gap: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              margin: '0.5rem 0',
            }}
          >
            {navItems
              .filter((k) => k.type === 'token')
              .map((themeKey) => (
                <Item key={themeKey.id} {...themeKey} />
              ))}
          </panda.ul>
        </div>
        <div>
          <span>PLAYGROUND</span>
          <panda.ul
            css={{
              listStyleType: 'none',
              padding: 0,
              gap: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              margin: '0.5rem 0',
            }}
          >
            {navItems
              .filter((k) => k.type === 'playground')
              .map((themeKey) => (
                <Item key={themeKey.id} {...themeKey} />
              ))}
          </panda.ul>
        </div>
      </panda.div>
    </panda.div>
  )
}

export default Index
