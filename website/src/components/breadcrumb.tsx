import type { ReactElement } from 'react'
import { Fragment } from 'react'
import { Anchor } from './anchor'
import { ArrowRightIcon } from 'nextra/icons'
import type { Item } from 'nextra/normalize-pages'
import { css } from '../../styled-system/css'
import { breadcrumbRecipe } from '../../styled-system/recipes'

export function Breadcrumb({
  activePath
}: {
  activePath: Item[]
}): ReactElement {
  return (
    <div
      data-scope="breadcrumb"
      data-part="root"
      className={breadcrumbRecipe()}
    >
      {activePath.map((item, index) => {
        const isLink = !item.children || item.withIndexPage
        const isActive = index === activePath.length - 1

        return (
          <Fragment key={item.route + item.name}>
            {index > 0 && (
              <ArrowRightIcon
                data-scope="breadcrumb"
                data-part="icon"
                className={css({ w: 3.5, flexShrink: 0 })}
              />
            )}
            <div
              data-scope="breadcrumb"
              data-part="item"
              data-active={isActive ? true : undefined}
              data-is-link={isLink ? true : undefined}
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
