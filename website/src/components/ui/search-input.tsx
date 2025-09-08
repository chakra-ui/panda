'use client'

import { Anchor } from '@/components/ui/anchor'
import { InformationCircleIcon, SpinnerIcon } from '@/icons'
import { useMounted } from '@/lib/use-mounted'
import { useMenu } from '@/mdx/contexts'
import { Input } from '@/mdx/input'
import { Kbd } from '@/mdx/kbd'
import { css, cx } from '@/styled-system/css'
import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

interface SearchProps {
  className?: string
  overlayClassName?: string
  value?: string
  onChange?: (newValue: string) => void
  onActive?: (active: boolean) => void
  loading?: boolean
  error?: boolean
  results?: any[]
}

const INPUTS = ['input', 'select', 'button', 'textarea']

export const SearchInput = (props: SearchProps) => {
  const { value, onChange, onActive, loading, error, results = [] } = props

  const [show, setShow] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)

  // TODO: Get search config
  const router = useRouter()
  const { setMenu } = useMenu()

  const input = useRef<HTMLInputElement | null>(null)
  const ulRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    setActive(0)
  }, [value])

  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent): void => {
      const activeElement = document.activeElement as HTMLElement
      const tagName = activeElement?.tagName.toLowerCase()
      if (
        !input.current ||
        !tagName ||
        INPUTS.includes(tagName) ||
        activeElement?.isContentEditable
      )
        return
      if (
        e.key === '/' ||
        (e.key === 'k' &&
          (e.metaKey /* for Mac */ || /* for non-Mac */ e.ctrlKey))
      ) {
        e.preventDefault()
        input.current.focus()
      } else if (e.key === 'Escape') {
        setShow(false)
        input.current.blur()
      }
    }

    window.addEventListener('keydown', down)
    return () => {
      window.removeEventListener('keydown', down)
    }
  }, [])

  const finishSearch = useCallback(() => {
    input.current?.blur()
    onChange?.('')
    setShow(false)
    setMenu(false)
  }, [onChange, setMenu])

  const handleActive = useCallback(
    (e: { currentTarget: { dataset: DOMStringMap } }) => {
      const { index } = e.currentTarget.dataset
      setActive(Number(index))
    },
    []
  )

  const handleKeyDown = useCallback(
    function <T>(e: React.KeyboardEvent<T>) {
      switch (e.key) {
        case 'ArrowDown': {
          if (active + 1 < results.length) {
            const el = ulRef.current?.querySelector<HTMLAnchorElement>(
              `li:nth-of-type(${active + 2}) > a`
            )
            if (el) {
              e.preventDefault()
              handleActive({ currentTarget: el })
              el.focus()
            }
          }
          break
        }
        case 'ArrowUp': {
          if (active - 1 >= 0) {
            const el = ulRef.current?.querySelector<HTMLAnchorElement>(
              `li:nth-of-type(${active}) > a`
            )
            if (el) {
              e.preventDefault()
              handleActive({ currentTarget: el })
              el.focus()
            }
          }
          break
        }
        case 'Enter': {
          const result = results[active]
          if (result) {
            void router.push(result.route)
            finishSearch()
          }
          break
        }
        case 'Escape': {
          setShow(false)
          input.current?.blur()
          break
        }
      }
    },
    [active, results, router, finishSearch, handleActive]
  )

  const mounted = useMounted()
  const renderList = show && Boolean(value)

  const icon = (
    <Kbd
      mounted={mounted}
      value={value}
      className={cx(css({ pointerEvents: renderList ? 'auto' : 'none' }))}
      onClick={() => onChange?.('')}
    >
      {value && focused
        ? 'ESC'
        : mounted &&
          (navigator.userAgent.includes('Macintosh') ? '⌘K' : 'CTRL K')}
    </Kbd>
  )

  return (
    <div
      className={css({
        display: 'inline-block',
        hideBelow: 'sm',
        minW: '200px',
        position: 'relative',
        md: { width: 64 },
        '& .excerpt': {
          truncate: true
        }
      })}
    >
      {renderList && (
        <div
          className={css({ position: 'fixed', inset: 0, zIndex: 10 })}
          onClick={() => setShow(false)}
        />
      )}

      <Input
        ref={input}
        value={value}
        onChange={e => {
          const { value } = e.target
          onChange?.(value)
          setShow(Boolean(value))
        }}
        onFocus={() => {
          onActive?.(true)
          setFocused(true)
        }}
        onBlur={() => {
          setFocused(false)
        }}
        type="search"
        placeholder="Search docs..."
        onKeyDown={handleKeyDown}
        suffix={icon}
      />

      <div
        className={css({
          opacity: renderList ? '1' : '0',
          pointerEvents: renderList ? 'auto' : 'none',
          transition: 'opacity'
        })}
      >
        <ul
          ref={ulRef}
          className={css({
            border: '1px solid rgb(243 244 246 / 0.2)',
            bg: 'white',
            color: 'gray.100',
            _dark: { borderColor: 'neutral.800', bg: 'neutral.900' },
            position: 'absolute',
            top: 'full',
            zIndex: 20,
            mt: '2',
            transition: 'max-height .2s ease',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            borderRadius: 'xl',
            py: '2.5',
            boxShadow: 'xl',
            maxHeight:
              'min(calc(50vh - 11rem - env(safe-area-inset-bottom)), 400px)',
            md: {
              maxHeight:
                'min(calc(100vh - 5rem - env(safe-area-inset-bottom)), 400px)'
            },
            insetEnd: '0',
            insetStart: 'auto'
          })}
        >
          {error ? (
            <span
              className={css({
                display: 'flex',
                userSelect: 'none',
                justifyContent: 'center',
                gap: '2',
                py: '8',
                textAlign: 'center',
                textStyle: 'sm',
                color: 'red.500'
              })}
            >
              <InformationCircleIcon
                className={css({ height: '5', width: '5' })}
              />
              Error loading search results
            </span>
          ) : loading ? (
            <span
              className={css({
                display: 'flex',
                userSelect: 'none',
                justifyContent: 'center',
                gap: 2,
                py: 8,
                textAlign: 'center',
                textStyle: 'sm',
                color: 'gray.400'
              })}
            >
              <SpinnerIcon
                className={css({
                  height: '5',
                  width: '5',
                  animation: 'spin 1s linear infinite'
                })}
              />
              Loading...
            </span>
          ) : results.length > 0 ? (
            results.map(({ route, prefix, children, id }, i) => (
              <Fragment key={id}>
                {prefix}
                <li
                  className={cx(
                    css({
                      mx: 2.5,
                      overflowWrap: 'break-word',
                      borderRadius: 'md'
                    }),
                    i === active
                      ? css({
                          bg: 'rgb(59 130 246 / 0.1)',
                          color: 'primary.600',
                          _dark: { borderColor: 'primary.500' }
                        })
                      : css({
                          color: 'gray.800',
                          _dark: { color: 'gray.300' }
                        })
                  )}
                >
                  <Anchor
                    className={css({
                      display: 'block',
                      scrollMargin: '12rem',
                      px: 2.5,
                      py: 2
                    })}
                    href={route}
                    data-index={i}
                    onFocus={handleActive}
                    onMouseMove={handleActive}
                    onClick={finishSearch}
                    onKeyDown={handleKeyDown}
                  >
                    {children}
                  </Anchor>
                </li>
              </Fragment>
            ))
          ) : (
            <span>No results found</span>
          )}
        </ul>
      </div>
    </div>
  )
}
