import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { ProseSize } from '@pandacss/preset-typography'
import { css, cx } from '../../styled-system/css'
import { prose } from '../../styled-system/recipes'
import { applyDarkClass, readDarkPreference } from '../lib/theme'
import { MarkdownSample } from './MarkdownSample'

const SIZES: ProseSize[] = ['sm', 'md', 'lg', 'xl', '2xl']

const sizeLabel: Record<ProseSize, string> = {
  sm: 'SM',
  md: 'MD',
  lg: 'LG',
  xl: 'XL',
  '2xl': '2XL',
}

export function Playground() {
  const [size, setSize] = useState<ProseSize>('md')
  const [dark, setDark] = useState(false)
  const [fullWidth, setFullWidth] = useState(false)

  useEffect(() => {
    const preferred = readDarkPreference()
    setDark(preferred)
    applyDarkClass(preferred)
  }, [])

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev
      applyDarkClass(next)
      return next
    })
  }

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      })}
    >
      <header
        className={css({
          position: 'sticky',
          top: '0',
          zIndex: '10',
          borderBottomWidth: '1px',
          borderBottomColor: 'neutral.200',
          bg: 'white/90',
          backdropFilter: 'blur(8px)',
          _dark: {
            borderBottomColor: 'neutral.800',
            bg: 'neutral.950/90',
          },
        })}
      >
        <div
          className={css({
            maxW: '6xl',
            mx: 'auto',
            px: '4',
            py: '3',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '3',
            justifyContent: 'space-between',
          })}
        >
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.5' })}>
            <strong className={css({ fontSize: 'sm', letterSpacing: 'tight' })}>
              Panda CSS — Prose
            </strong>
            <div className={css({ display: 'flex', gap: '3', fontSize: 'xs' })}>
              <span className={css({ color: 'neutral.500', _dark: { color: 'neutral.400' } })}>
                @pandacss/preset-typography
              </span>
              <Link
                to="/not-prose"
                className={css({
                  color: 'neutral.700',
                  textDecoration: 'underline',
                  _dark: { color: 'neutral.200' },
                })}
              >
                not-prose demo
              </Link>
            </div>
          </div>

          <div className={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3' })}>
            <div
              className={css({
                display: 'inline-flex',
                p: '0.5',
                gap: '0.5',
                rounded: 'md',
                bg: 'neutral.100',
                _dark: { bg: 'neutral.900' },
              })}
              role="group"
              aria-label="Prose size"
            >
              {SIZES.map((value) => {
                const active = value === size
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSize(value)}
                    className={css({
                      px: '2.5',
                      py: '1',
                      fontSize: 'xs',
                      fontWeight: 'semibold',
                      letterSpacing: 'wide',
                      rounded: 'sm',
                      cursor: 'pointer',
                      borderWidth: '0',
                      bg: active ? 'neutral.900' : 'transparent',
                      color: active ? 'white' : 'neutral.600',
                      _dark: {
                        bg: active ? 'neutral.100' : 'transparent',
                        color: active ? 'neutral.900' : 'neutral.300',
                      },
                    })}
                  >
                    {sizeLabel[value]}
                  </button>
                )
              })}
            </div>

            <label
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                fontSize: 'xs',
                color: 'neutral.600',
                _dark: { color: 'neutral.300' },
                cursor: 'pointer',
                userSelect: 'none',
              })}
            >
              <input
                type="checkbox"
                checked={fullWidth}
                onChange={(event) => setFullWidth(event.target.checked)}
              />
              Max width off
            </label>

            <button
              type="button"
              onClick={toggleDark}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                rounded: 'md',
                cursor: 'pointer',
                borderWidth: '1px',
                borderColor: 'neutral.300',
                bg: 'white',
                _dark: {
                  borderColor: 'neutral.700',
                  bg: 'neutral.900',
                  color: 'neutral.100',
                },
              })}
            >
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      <main
        className={css({
          flex: '1',
          px: '4',
          py: { base: '8', md: '12' },
        })}
      >
        <article
          className={cx(
            prose({ size }),
            css({
              mx: 'auto',
              ...(fullWidth ? { maxW: 'none' } : {}),
            }),
          )}
        >
          <h1>Garlic bread with cheese: What the science tells us</h1>
          <MarkdownSample />
        </article>
      </main>
    </div>
  )
}
