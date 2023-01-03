import { config } from 'virtual:panda'
import { panda } from '../../design-system/jsx'
import type { JSXStyleProperties } from '../../design-system/types'
import type { PropsWithChildren } from 'react'

const title = config.docs?.title ?? 'Panda'

export const customDocs = {
  title,
  pageTitle: `${title} Design System Docs`,
  logo(props: PropsWithChildren<JSXStyleProperties>) {
    return config.docs?.logo ? (
      <panda.img src={config.docs?.logo} width="16" {...props} />
    ) : (
      <panda.span {...props}>🐼 </panda.span>
    )
  },
}
