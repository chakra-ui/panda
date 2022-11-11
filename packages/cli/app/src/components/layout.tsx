import '../App.css'
import { navItems } from '../utils/constants'
import { NavLink } from 'react-router-dom'

type LayoutProps = { children: React.ReactNode }

export function Layout(props: LayoutProps) {
  const { children } = props

  return (
    <main>
      <aside>
        <span className="title">🐼 Panda</span>
        <div>
          <span>TOKENS</span>
          <ul>
            {navItems
              .filter((k) => k.type === 'token')
              .map((themeKey) => (
                <NavLink key={themeKey.id} to={`/${themeKey.id}`}>
                  {({ isActive }) => <li data-active={isActive ? '' : undefined}>{themeKey.label}</li>}
                </NavLink>
              ))}
          </ul>
          <span>PLAYGROUND</span>
          <ul>
            {navItems
              .filter((k) => k.type === 'playground')
              .map((themeKey) => (
                <NavLink key={themeKey.id} to={`/${themeKey.id}`}>
                  {({ isActive }) => <li data-active={isActive ? '' : undefined}>{themeKey.label}</li>}
                </NavLink>
              ))}
          </ul>
        </div>
      </aside>
      <div className="content">{children}</div>
      <div className="badge">🐼 Made with Panda</div>
    </main>
  )
}
