import { panda } from '@/styled-system/jsx'

export const SidebarPlaceholder = panda('div', {
  base: {
    h: 0,
    w: 64,
    flexShrink: 0,
    xl: {
      display: 'none'
    }
  }
})
