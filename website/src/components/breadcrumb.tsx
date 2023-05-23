import type { Item } from 'nextra/normalize-pages'
import type { ReactElement } from 'react'
import { css } from '../../styled-system/css'

export function Breadcrumb({
  activePath
}: {
  activePath: Item[]
}): ReactElement {
  const currentPath = activePath[1]
  return (
    <p className={css({ fontWeight: 'semibold', color: 'blue.500', mb: '6' })}>
      {currentPath.title}
    </p>
  )
}
