import { css } from '../../design-system/css'
import { panda, Wrap } from '../../design-system/jsx'
import { NavItem } from './nav-item'
import { navItems } from '../utils/constants'
import { customDocs } from '../utils/custom-docs'

export function Overview() {
  return (
    <panda.div display="flex" flexDir="column">
      <panda.span fontWeight="bold" fontSize="2xl" paddingX="8" paddingY="4" display="flex" gap="2">
        <customDocs.logo />
        {customDocs.title}
      </panda.span>
      <panda.div paddingX="8" paddingY="24" marginBottom="10" background="card">
        <panda.span display="block" fontSize="3xl" fontWeight="semibold" marginBottom="6">
          Design System
        </panda.span>
        <panda.span display="block">Build great products, faster.</panda.span>
        <panda.a
          href="/colors"
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
        </panda.a>
      </panda.div>
      <Wrap gap="6" padding="8" marginY="2">
        <div>
          <panda.span display="block">TOKENS</panda.span>
          <Wrap marginY="2" padding="0" gap="6">
            {navItems
              .filter((k) => k.type === 'token')
              .map((themeKey) => (
                <NavItem key={themeKey.id} {...themeKey} />
              ))}
          </Wrap>
        </div>
        <div>
          <panda.span display="block">PLAYGROUND</panda.span>
          <Wrap marginY="2" padding="0" gap="6">
            {navItems
              .filter((k) => k.type === 'playground')
              .map((themeKey) => (
                <NavItem key={themeKey.id} {...themeKey} />
              ))}
          </Wrap>
        </div>
      </Wrap>
    </panda.div>
  )
}
