import { memo } from './memo'

const dashCaseRegex = /[A-Z]/g
export const hypenateProperty = memo((property: string) => {
  if (property.startsWith('--')) return property
  return property.replace(dashCaseRegex, (match) => `-${match.toLowerCase()}`)
})
