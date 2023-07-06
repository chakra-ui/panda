import { memo } from './memo'

const wordRegex = /([A-Z])/g
const msRegex = /^ms-/

export const hypenateProperty = memo((property: string) => {
  if (property.startsWith('--')) return property
  return property.replace(wordRegex, '-$1').replace(msRegex, '-ms-').toLowerCase()
})
