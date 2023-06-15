import { css, cx } from '@/styled-system/css'
import type { Heading } from 'nextra'
import { useEffect, useMemo, useRef } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import { renderComponent } from './lib'
import { Anchor } from './anchor'
import { useActiveAnchor, useConfig } from './contexts'

export type TOCProps = {
  headings: Heading[]
  filePath: string
}

export function TOC({ headings, filePath }: TOCProps) {
  const activeAnchor = useActiveAnchor()
  const config = useConfig()
  const tocRef = useRef<HTMLDivElement>(null)

  const items = useMemo(
    () => headings.filter(heading => heading.depth > 1),
    [headings]
  )

  const hasHeadings = items.length > 0
  const hasMetaInfo = Boolean(
    config.feedback.content ||
      config.editLink.component ||
      config.toc.extraContent
  )

  const activeSlug = Object.entries(activeAnchor).find(
    ([, { isActive }]) => isActive
  )?.[0]

  useEffect(() => {
    if (!activeSlug) return
    const anchor = tocRef.current?.querySelector(
      `li > a[href="#${activeSlug}"]`
    )

    if (anchor) {
      scrollIntoView(anchor, {
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
        scrollMode: 'always',
        boundary: tocRef.current
      })
    }
  }, [activeSlug])

  const linkClassName = css({
    textStyle: 'xs',
    fontWeight: 'medium',
    color: 'gray.500',
    _hover: { color: 'gray.900' },
    _dark: {
      color: 'gray.400',
      _hover: { color: 'gray.100' }
    }
  })

  return (
    <div
      ref={tocRef}
      className={cx(
        'nextra-scrollbar',
        css({
          position: 'sticky',
          top: '16',
          overflowY: 'auto',
          px: 8,
          pt: 6,
          textStyle: 'sm',
          hyphens: 'auto',
          maxHeight:
            'calc(100vh - var(--nextra-navbar-height) - env(safe-area-inset-bottom))'
        })
      )}
    >
      {hasHeadings && (
        <>
          <p
            className={css({
              mb: 4,
              fontWeight: 'medium',
              letterSpacing: 'tight'
            })}
          >
            {renderComponent(config.toc.title)}
          </p>
          <ul>
            {items.map(({ id, value, depth }) => (
              <li
                className={css({ my: 2, scrollMarginY: 6, scrollPaddingY: 6 })}
                key={id}
              >
                <a
                  href={`#${id}`}
                  className={cx(
                    {
                      2: css({ fontWeight: 'medium' }),
                      3: css({ ms: '4' }),
                      4: css({ ms: '8' }),
                      5: css({ ms: '12' }),
                      6: css({ ms: '16' })
                    }[depth as Exclude<typeof depth, 1>],
                    css({ display: 'inline-block' }),
                    activeAnchor[id]?.isActive
                      ? css({
                          color: 'black',
                          position: 'relative',
                          _before: {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            inset: '0 -10px 0 -10px',
                            bg: 'yellow.200',
                            rounded: 'md',
                            zIndex: -1,
                            _dark: {
                              bg: 'yellow.300'
                            }
                          },
                          _after: {
                            content: '"🐼"',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'absolute',
                            top: '50%',
                            left: '-6',
                            w: '6',
                            h: '6',
                            transform: 'translateY(-50%)',
                            bg: 'yellow.200',
                            rounded: 'full',
                            _dark: {
                              bg: 'yellow.300'
                            }
                          }
                        })
                      : css({
                          color: 'gray.500',
                          _hover: { color: 'gray.900' },
                          _dark: {
                            color: 'gray.400',
                            _hover: { color: 'gray.300' }
                          }
                        })
                  )}
                >
                  {config.toc.headingComponent?.({
                    id,
                    children: value
                  }) ?? value}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {hasMetaInfo && (
        <div
          className={cx(
            hasHeadings &&
              css({
                mt: 8,
                borderTopWidth: '1px',
                borderColor: 'neutral.300',
                bg: 'white',
                pt: 8,
                shadow: '0 -12px 16px white',
                _dark: {
                  bg: 'dark',
                  shadow: '0 -12px 16px #111',
                  borderColor: 'neutral.800'
                },
                position: 'sticky',
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                pb: 8
              })
          )}
        >
          {config.feedback.content ? (
            <Anchor
              className={linkClassName}
              href={config.feedback.useLink()}
              newWindow
            >
              {renderComponent(config.feedback.content)}
            </Anchor>
          ) : null}

          {renderComponent(config.editLink.component, {
            filePath,
            className: linkClassName,
            children: renderComponent(config.editLink.text)
          })}

          {renderComponent(config.toc.extraContent)}
        </div>
      )}
    </div>
  )
}
