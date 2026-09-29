import { sva } from '@panda/css'

export const tabs = sva({
  slots: ['root', 'trigger'],
  base: { root: { bg: 'red' }, trigger: { fontSize: '12px' } },
})
