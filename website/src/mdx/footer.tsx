import { docsConfig } from '@/docs.config'
import { renderComponent } from '@/lib/render'
import { css, cx } from '@/styled-system/css'

export const Footer = () => {
  return (
    <footer
      className={css({
        bg: 'gray.100',
        pb: 'env(safe-area-inset-bottom)',
        _dark: { bg: 'neutral.900' }
      })}
    >
      <hr className={css({ _dark: { borderColor: 'neutral.800' } })} />
      <div
        className={cx(
          css({
            mx: 'auto',
            display: 'flex',
            maxW: '90rem',
            justifyContent: 'center',
            py: '12',
            color: 'gray.600',
            _dark: { color: 'gray.400' },
            md: { justifyContent: 'flex-start' }
          }),
          css({
            pl: 'max(env(safe-area-inset-left),1.5rem)',
            pr: 'max(env(safe-area-inset-right),1.5rem)'
          })
        )}
      >
        {renderComponent(docsConfig.footer)}
      </div>
    </footer>
  )
}
