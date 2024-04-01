import * as React from 'react'
import { css, cva } from '../../styled-system/css'
import { flex, hstack, square, vstack } from '../../styled-system/patterns'
import { Yums } from '../icons/yums'
import { Logo } from '../icons/logo'
import { Wrap } from '../../styled-system/jsx'
import { navItems } from '../lib/constants'
import { getUrl } from '../lib/url'

const buttonRecipe = cva({
  base: {
    display: 'inline-flex',
    px: '6',
    py: '3',
    fontWeight: 'medium',
    fontSize: '2xl',
    rounded: 'sm',
  },
  variants: {
    variant: {
      solid: {
        bg: 'yellow.300',
        color: 'black',
      },
      outline: {
        borderWidth: '1px',
        color: 'yellow.300',
      },
    },
  },
})

export default function Overview() {
  return (
    <div
      className={flex({
        direction: 'column',
        minH: 'dvh',
        borderTopWidth: '8px',
        borderTopColor: 'accent',
      })}
    >
      <div className={vstack({ px: '8', py: '12dvh', mb: '10', flex: '1' })}>
        <Logo />

        <div className={vstack({ my: '10', textAlign: 'center' })}>
          <Yums className={css({ fontSize: '24rem', h: '300px' })} />
          <span className={css({ fontSize: '7xl', letterSpacing: 'tighter', fontWeight: 'medium' })}>Panda Studio</span>
          <p className={css({ fontSize: '2xl' })}>Live documentation for your design tokens (colors, fonts, etc.)</p>
        </div>

        <div className={hstack({ gap: '6' })}>
          <a href={getUrl('colors')} className={buttonRecipe({ variant: 'solid' })}>
            Get Started
          </a>
          <a href="https://panda-css.com?ref=studio" target="_blank" className={buttonRecipe({ variant: 'outline' })}>
            View Docs
          </a>
        </div>

        <Wrap mt="20" p="0" gap="6" justify="center">
          {navItems
            .filter((k) => k.type === 'token')
            .map((item, index) => (
              <div key={index}>
                <a
                  title={item.label}
                  href={getUrl(item.id)}
                  className={square({
                    size: '20',
                    fontSize: '2xl',
                    fontWeight: 'medium',
                    color: 'accent',
                    borderWidth: '1px',
                    borderColor: 'card',
                  })}
                >
                  <item.icon />
                </a>
              </div>
            ))}
        </Wrap>
      </div>
    </div>
  )
}
