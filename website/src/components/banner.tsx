import type { ReactElement } from 'react'
import { XIcon } from 'nextra/icons'
import { useConfig } from '../contexts'
import { renderComponent } from '../utils'
import { css, cx } from '../../styled-system/css'

export function Banner(): ReactElement | null {
  const { banner } = useConfig()
  if (!banner.text) {
    return null
  }
  const hideBannerScript = `try{if(localStorage.getItem(${JSON.stringify(
    banner.key
  )})==='0'){document.body.classList.add('nextra-banner-hidden')}}catch(e){}`

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: hideBannerScript }} />
      <div
        className={cx(
          'nextra-banner-container',
          css({
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            md: { position: 'relative' },
            h: 'var(--nextra-banner-height)',
            '& ~ div': {
              '& .nextra-sidebar-container': {
                pt: '6.5rem'
              },
              '&.nextra-nav-container': {
                top: 10,
                md: { top: 0 }
              }
            },
            'body.nextra-banner-hidden &': {
              display: 'none',
              '& ~ div': {
                '& .nextra-sidebar-container': {
                  pt: '16'
                },
                '&.nextra-nav-container': {
                  top: 0
                }
              }
            },
            color: 'slate.50',
            bg: 'neutral.900',
            _dark: {
              color: 'white',
              bg: 'linear-gradient(1deg,#383838,#212121)'
            },
            px: 2,
            _ltr: { pl: 10 },
            _rtl: { pr: 10 },
            _print: { display: 'none' }
          })
        )}
      >
        <div
          className={css({
            w: 'full',
            truncate: true,
            px: 4,
            textAlign: 'center',
            fontWeight: 'medium',
            textStyle: 'sm'
          })}
        >
          {renderComponent(banner.text)}
        </div>
        {banner.dismissible && (
          <button
            type="button"
            aria-label="Dismiss banner"
            className={css({
              w: 8,
              h: 8,
              opacity: 0.8,
              _hover: { opacity: 1 }
            })}
            onClick={() => {
              try {
                localStorage.setItem(banner.key, '0')
              } catch {
                /* ignore */
              }
              document.body.classList.add('nextra-banner-hidden')
            }}
          >
            <XIcon className={css({ mx: 'auto', h: 4, w: 4 })} />
          </button>
        )}
      </div>
    </>
  )
}
