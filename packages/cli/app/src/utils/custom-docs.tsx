import { config } from 'virtual:panda'
import { panda } from '../../design-system/jsx'

const title = config.studio?.title ?? 'Panda'

export const customDocs = {
  title,
  pageTitle: `${title} Design System Docs`,
  logo(props: any) {
    return config.studio?.logo ? (
      <panda.img src={config.studio?.logo} width="16" {...props} />
    ) : (
      <panda.span {...props}>🐼 </panda.span>
    )
  },
}
