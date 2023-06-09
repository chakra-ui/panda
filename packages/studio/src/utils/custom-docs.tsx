import { config } from 'virtual:panda'
import { panda } from '../../styled-system/jsx'
import { Logo } from '../components/logo'

const title = config.studio?.title ?? 'Panda'

export const customDocs = {
  title,
  pageTitle: `${title} Design System Docs`,
  logo(props: any) {
    return config.studio?.logo ? <panda.img src={config.studio?.logo} width="16" {...props} /> : <Logo />
  },
}
