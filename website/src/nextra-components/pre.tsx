import type { ComponentProps, ReactElement } from 'react'
import { useCallback, useRef } from 'react'
import { CopyToClipboard } from './copy-to-clipboard'
import { Button } from './button'
import { WordWrapIcon } from '../icons'
import { css } from '../../styled-system/css'

export const Pre = ({
  children,
  className = '',
  hasCopyCode,
  filename,
  ...props
}: ComponentProps<'pre'> & {
  filename?: string
  hasCopyCode?: boolean
}): ReactElement => {
  const preRef = useRef<HTMLPreElement | null>(null)

  const toggleWordWrap = useCallback(() => {
    const htmlDataset = document.documentElement.dataset
    const hasWordWrap = 'nextraWordWrap' in htmlDataset
    if (hasWordWrap) {
      delete htmlDataset.nextraWordWrap
    } else {
      htmlDataset.nextraWordWrap = ''
    }
  }, [])

  return (
    <div
      className={css({ position: 'relative', mt: '6', _first: { mt: '0' } })}
    >
      {filename && (
        <div
          className={css({
            position: 'absolute',
            top: '0',
            zIndex: '1',
            width: 'full',
            truncate: true,
            roundedTop: 'xl',
            bg: 'hsl(var(--nextra-primary-hue) 100% var(--color-primary-700-hue) / 0.05)', // primary-700/5
            py: '2',
            px: '4',
            textStyle: 'xs',
            color: 'gray.700',
            _dark: {
              bg: 'hsl(var(--nextra-primary-hue) 100% var(--color-primary-300-hue) / 0.1)', // primary.300/10
              color: 'gray.200'
            }
          })}
        >
          {filename}
        </div>
      )}
      <pre
        className={[
          css({
            bg: 'hsl(var(--nextra-primary-hue) 100% var(--color-primary-700-hue) / 0.05)', // primary-700/5
            mb: '4',
            overflowX: 'auto',
            rounded: 'xl',
            WebkitFontSmoothing: 'auto',
            MozOsxFontSmoothing: 'auto',
            _dark: {
              bg: 'hsl(var(--nextra-primary-hue) 100% var(--color-primary-300-hue) / 0.1)' // bg: 'primary.300/10',
            },
            _moreContrast: {
              border:
                '1px solid hsl(var(--nextra-primary-hue) 100% var(--color-primary-900-hue) / 0.2)',
              // contrast-more:nx-contrast-150
              _dark: {
                borderColor:
                  'hsl(var(--nextra-primary-hue) 100% var(--color-primary-100-hue) / 0.4)'
              }
            }
          }),
          filename ? css({ pt: '12', pb: '4' }) : css({ py: '4' }),
          className
        ].join(' ')}
        ref={preRef}
        {...props}
      >
        {children}
      </pre>
      <div
        className={[
          css({
            opacity: '0',
            transition: 'opacity 0.2s',
            'div:hover > &': { opacity: 1 },
            _focusWithin: { opacity: 1 },
            display: 'flex',
            gap: '1',
            position: 'absolute',
            m: '11px',
            right: '0'
          }),
          filename ? css({ top: '2' }) : css({ top: '0' })
        ].join(' ')}
      >
        <Button
          onClick={toggleWordWrap}
          className={css({ md: { display: 'none' } })}
          title="Toggle word wrap"
        >
          <WordWrapIcon
            className={css({ pointerEvents: 'none', h: 4, w: 4 })}
          />
        </Button>
        {hasCopyCode && (
          <CopyToClipboard
            getValue={() =>
              preRef.current?.querySelector('code')?.textContent || ''
            }
          />
        )}
      </div>
    </div>
  )
}
