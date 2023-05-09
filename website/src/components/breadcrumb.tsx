import type { ReactElement } from 'react'
import { Fragment } from 'react'
import { Anchor } from './anchor'
import { ArrowRightIcon } from 'nextra/icons'
import type { Item } from 'nextra/normalize-pages'
import { css, cx } from '../../styled-system/css'

export function Breadcrumb({
  activePath
}: {
  activePath: Item[]
}): ReactElement {
  return (
    <div
      className={cx(
        'nextra-breadcrumb',
        css({
          mt: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflow: 'hidden',
          textStyle: 'sm',
          color: 'gray.500',
          _moreContrast: { color: 'currentColor' }
        })
      )}
    >
      {activePath.map((item, index) => {
        const isLink = !item.children || item.withIndexPage
        const isActive = index === activePath.length - 1

        return (
          <Fragment key={item.route + item.name}>
            {index > 0 && (
              <ArrowRightIcon className={css({ w: 3.5, flexShrink: 0 })} />
            )}
            <div
              className={cx(
                css({
                  whiteSpace: 'nowrap',
                  transitionProperty: 'colors',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDuration: '150ms'
                }),

                isActive
                  ? css({
                      fontWeight: 'medium',
                      color: 'gray.700',
                      _moreContrast: {
                        fontWeight: 'bold',
                        color: 'currentColor'
                      },
                      _dark: {
                        color: 'gray.400',
                        _moreContrast: {
                          color: 'currentColor'
                        }
                      }
                    })
                  : [
                      css({
                        minWidth: '24px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }),
                      isLink &&
                        css({
                          color: {
                            _hover: 'gray.900',
                            _dark: { _hover: 'gray.200' }
                          }
                        })
                    ].join(' ')
              )}
              title={item.title}
            >
              {isLink && !isActive ? (
                <Anchor href={item.route}>{item.title}</Anchor>
              ) : (
                item.title
              )}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
