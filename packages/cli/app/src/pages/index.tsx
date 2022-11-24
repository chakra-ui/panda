import { navItems } from '../utils/constants'
import { NavLink } from 'react-router-dom'

function Index() {
  return (
    <div className="home">
      <span className="title">🐼 Panda</span>
      <div className="banner">
        <span className="intro">Design System</span>
        <span>Build great products, faster.</span>
        <NavLink to="/colors" className="cta">
          Explore
        </NavLink>
      </div>
      <div className="content">
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
      </div>
    </div>
  )
}

export default Index
