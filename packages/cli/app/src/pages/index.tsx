import { navItems } from '../utils/constants'
import { NavLink } from 'react-router-dom'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

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
        className={css({
          '& span': { display: 'block' },
        })}
      >
        <panda.span fontSize="1.7em" fontWeight={600} marginBottom="24px">
          Design System
        </panda.span>
        <span>Build great products, faster.</span>
        <NavLink
          to="/colors"
          className={css({
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
          })}
        >
          Explore
        </NavLink>
      </panda.div>
      <panda.div
        display="flex"
        flexDir="column"
        gap="24px"
        padding="2rem"
        className={css({
          listStyleType: 'none',
          padding: '0',
          margin: '0.5rem 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        })}
      >
        <div>
          <span>TOKENS</span>
          <ul>
            {navItems
              .filter((k) => k.type === 'token')
              .map((themeKey) => (
                <NavLink key={themeKey.id} to={`/${themeKey.id}`}>
                  {({ isActive }) => (
                    <li className="item" data-active={isActive ? '' : undefined}>
                      <span className="icon">
                        <themeKey.icon />
                      </span>
                      <span className="title"> {themeKey.label} </span>
                      <span className="description"> {themeKey.description} </span>
                    </li>
                  )}
                </NavLink>
              ))}
          </ul>
        </div>
        <div>
          <span>PLAYGROUND</span>
          <ul>
            {navItems
              .filter((k) => k.type === 'playground')
              .map((themeKey) => (
                <NavLink key={themeKey.id} to={`/${themeKey.id}`}>
                  {({ isActive }) => (
                    <li className="item" data-active={isActive ? '' : undefined}>
                      <span className="icon">
                        <themeKey.icon />
                      </span>
                      <span className="title"> {themeKey.label} </span>
                      <span className="description"> {themeKey.description} </span>
                    </li>
                  )}
                </NavLink>
              ))}
          </ul>
        </div>
      </panda.div>
    </panda.div>
  )
}

export default Index
