import { css } from '../../styled-system/css'
import { panda, Wrap } from '../../styled-system/jsx'
import { NavItem } from './nav-item'
import { navItems } from '../lib/constants'
import { Logo } from './logo'

export function Overview() {
  return (
    <panda.div display="flex" flexDir="column">
      <panda.span fontWeight="bold" fontSize="2xl" px="8" py="4" display="flex" gap="2">
        <Logo />
      </panda.span>
      <panda.div px="8" py="24" mb="10" background="card">
        <panda.span display="block" fontSize="3xl" fontWeight="semibold" mb="6">
          Design System
        </panda.span>
        <p>Build great products, faster.</p>
        <panda.a
          href="/colors"
          className={css({
            background: '#646cff',
            color: 'white',
            width: 'fit-content',
            fontSize: 'small',
            fontWeight: 'semibold',
            px: '6',
            py: '1',
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
      <Wrap gap="6" p="8" my="2">
        <div>
          <panda.span display="block">TOKENS</panda.span>
          <Wrap my="2" p="0" gap="6">
            {navItems
              .filter((k) => k.type === 'token')
              .map((data, index) => (
                <NavItem key={index} {...data} />
              ))}
          </Wrap>
        </div>
        <div>
          <panda.span display="block">PLAYGROUND</panda.span>
          <Wrap my="2" p="0" gap="6">
            {navItems
              .filter((k) => k.type === 'playground')
              .map((data, index) => (
                <NavItem key={index} {...data} />
              ))}
          </Wrap>
        </div>
      </Wrap>
    </panda.div>
  )
}
