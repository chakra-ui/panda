import { memo } from './memo'

export const hypenateProperty = memo((property: string) => {
  if (property.startsWith('--')) return property
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
})
