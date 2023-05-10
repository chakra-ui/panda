import type { ReactElement } from 'react'
import { useConfig } from '../contexts'
import { LocaleSwitch } from './locale-switch'
import { renderComponent } from '../utils'
import { css, cx } from '../../styled-system/css'

export function Footer({ menu }: { menu?: boolean }): ReactElement {
  const config = useConfig()
  return (
    <footer
      className={css({
        bg: 'gray.100',
        pb: 'env(safe-area-inset-bottom)',
        _dark: { bg: 'neutral.900' }
      })}
    >
      <div
        className={cx(
          css({
            mx: 'auto',
            display: 'flex',
            maxW: '90rem',
            gap: 2,
            py: 2,
            px: 4
          }),
          menu && (config.i18n.length > 0 || config.darkMode)
            ? css({ display: 'flex' })
            : css({ display: 'none' })
        )}
      >
        {config.i18n.length > 0 && <LocaleSwitch options={config.i18n} />}
        {config.darkMode && renderComponent(config.themeSwitch.component)}
      </div>
      <hr className={css({ _dark: { borderColor: 'neutral.800' } })} />
      <div
        className={cx(
          css({
            mx: 'auto',
            display: 'flex',
            maxW: '90rem',
            justifyContent: 'center',
            py: 12,
            color: 'gray.600',
            _dark: { color: 'gray.400' },
            md: { justifyContent: 'start' }
          }),
          css({
            pl: 'max(env(safe-area-inset-left),1.5rem)',
            pr: 'max(env(safe-area-inset-right),1.5rem)'
          })
        )}
      >
        {renderComponent(config.footer.text)}
      </div>
    </footer>
  )
}
