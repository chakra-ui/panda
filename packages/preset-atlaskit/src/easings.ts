import type { Tokens } from '@pandacss/types'

export const easings: Tokens['easings'] = {
  easeIn: { value: 'cubic-bezier(0.8,0,0,0.8)' },
  easeIn40Out: { value: 'cubic-bezier(0.4,0,0,1)' },
  easeIn60Out: { value: 'cubic-bezier(0.6,0,0,1)' },
  easeIn80Out: { value: 'cubic-bezier(0.8,0,0,1)' },
  easeInOut: { value: 'cubic-bezier(0.15,1,0.3,1)' },
  easeOut: { value: 'cubic-bezier(0.2,0,0,1)' },
  linear: { value: 'cubic-bezier(0,0,1,1)' },
}
