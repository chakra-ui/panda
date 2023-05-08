import type { ReactElement, KeyboardEvent } from 'react'
import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import cn from 'clsx'
import { Transition } from '@headlessui/react'
import { InformationCircleIcon, SpinnerIcon } from 'nextra/icons'
import { useMounted } from 'nextra/hooks'
import { Input } from './input'
import { Anchor } from './anchor'
import { renderComponent, renderString } from '../utils'
import { useConfig, useMenu } from '../contexts'
import { useRouter } from 'next/router'
import type { SearchResult } from '../types'
import { css } from '../../styled-system/css'

type SearchProps = {
  className?: string
  overlayClassName?: string
  value: string
  onChange: (newValue: string) => void
  onActive?: (active: boolean) => void
  loading?: boolean
  error?: boolean
  results: SearchResult[]
}

const INPUTS = ['input', 'select', 'button', 'textarea']

export function Search({
  className,
  overlayClassName,
  value,
  onChange,
  onActive,
  loading,
  error,
  results
}: SearchProps): ReactElement {
  const [show, setShow] = useState(false)
  const config = useConfig()
  const [active, setActive] = useState(0)
  const router = useRouter()
  const { setMenu } = useMenu()
  const input = useRef<HTMLInputElement>(null)
  const ulRef = useRef<HTMLUListElement>(null)
  const [focused, setFocused] = useState(false)

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
    onChange('')
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
    function <T>(e: KeyboardEvent<T>) {
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
    <Transition
      show={mounted && (!show || Boolean(value))}
      as={Fragment}
      enter={css({ transitionProperty: 'opacity' })}
      enterFrom={css({ opacity: 0 })}
      enterTo={css({ opacity: 1 })}
      leave={css({ transitionProperty: 'opacity' })}
      leaveFrom={css({ opacity: 1 })}
      leaveTo={css({ opacity: 0 })}
    >
      <kbd
        className={cn(
          css({
            position: 'absolute',
            my: 1.5,
            userSelect: 'none',
            _ltr: { right: 1.5 },
            _rtl: { left: 1.5 },
            height: 5,
            borderRadius: 'md',
            backgroundColor: 'white',
            px: 1.5,
            fontFamily: 'mono',
            fontSize: 'xs',
            fontWeight: 'medium',
            color: 'gray.500',
            border: '1px solid',
            borderColor: 'gray.100/20',
            _dark: { bgColor: 'dark/50' },
            _moreContrast: {
              borderColor: 'current',
              color: 'current',
              _dark: { borderColor: 'current' }
            },
            alignItems: 'center',
            gap: 1,
            transitionProperty: 'opacity'
          }),
          value
            ? css({
                zIndex: 20,
                display: 'flex',
                cursor: 'pointer',
                _hover: { opacity: 0.7 }
              })
            : css({
                pointerEvents: 'none',
                display: 'none',
                sm: { display: 'flex' }
              })
        )}
        title={value ? 'Clear' : undefined}
        onClick={() => {
          onChange('')
        }}
      >
        {value && focused
          ? 'ESC'
          : mounted &&
            (navigator.userAgent.includes('Macintosh') ? (
              <>
                <span className={css({ textStyle: 'xs' })}>⌘</span>K
              </>
            ) : (
              'CTRL K'
            ))}
      </kbd>
    </Transition>
  )

  return (
    <div
      className={cn(
        'nextra-search',
        css({
          position: 'relative',
          md: { width: 64 },
          '& .excerpt': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            lineClamp: 1,
            '-webkit-line-clamp': 1,
            '-webkit-box-orient': 'vertical'
          }
        }),
        className
      )}
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
          onChange(value)
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
        placeholder={renderString(config.search.placeholder)}
        onKeyDown={handleKeyDown}
        suffix={icon}
      />

      <Transition
        show={renderList}
        // Transition.Child is required here, otherwise popup will be still present in DOM after focus out
        as={Transition.Child}
        leave={css({
          transitionProperty: 'opacity',
          transitionDuration: '100ms'
        })}
        leaveFrom={css({ opacity: 1 })}
        leaveTo={css({ opacity: 0 })}
      >
        <ul
          className={cn(
            'nextra-scrollbar',
            // Using bg-white as background-color when the browser didn't support backdrop-filter
            css({
              border: '1px solid',
              borderColor: 'gray.100/20',
              backgroundColor: 'white',
              color: 'gray.100',
              _dark: { borderColor: 'neutral.800', bgColor: 'neutral.900' },
              position: 'absolute',
              top: 'full',
              zIndex: 20,
              mt: 2,
              overflow: 'auto',
              overscrollBehavior: 'contain',
              borderRadius: 'xl',
              py: 2.5,
              boxShadow: 'xl',
              maxHeight:
                'min(calc(50vh-11rem-env(safe-area-inset-bottom)),400px)',
              md: {
                maxHeight:
                  'min(calc(100vh-5rem-env(safe-area-inset-bottom)),400px)'
              },
              insetX: 0,
              _ltr: { left: 'auto' },
              _rtl: { right: 'auto' },
              _moreContrast: {
                border: '1px',
                borderColor: 'gray.900',
                _dark: { borderColor: 'gray.50' }
              }
            }),
            overlayClassName
          )}
          ref={ulRef}
          style={{
            transition: 'max-height .2s ease' // don't work with tailwindcss
          }}
        >
          {error ? (
            <span
              className={css({
                display: 'flex',
                userSelect: 'none',
                justifyContent: 'center',
                gap: 2,
                py: 8,
                textAlign: 'center',
                textStyle: 'sm',
                color: 'red.500'
              })}
            >
              <InformationCircleIcon
                className={css({ height: '5', width: '5' })}
              />
              {renderString(config.search.error)}
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
              {renderComponent(config.search.loading)}
            </span>
          ) : results.length > 0 ? (
            results.map(({ route, prefix, children, id }, i) => (
              <Fragment key={id}>
                {prefix}
                <li
                  className={cn(
                    css({
                      mx: 2.5,
                      overflowWrap: 'break-word',
                      borderRadius: 'md',
                      _moreContrast: { border: '1px' }
                    }),
                    i === active
                      ? css({
                          bg: 'primary.500/10',
                          color: 'primary.600',
                          _dark: { borderColor: 'primary.500' }
                        })
                      : css({
                          color: 'gray.800',
                          _moreContrast: { borderColor: 'transparent' },
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
            renderComponent(config.search.emptyResult)
          )}
        </ul>
      </Transition>
    </div>
  )
}
