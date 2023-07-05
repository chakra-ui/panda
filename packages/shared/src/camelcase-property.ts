import { memo } from './memo'

const regex = /-(\w|$)/g

const callback = (_dashChar: string, char: string) => char.toUpperCase()

export const camelCaseProperty = memo((property: string) => {
  if (property.startsWith('--')) return property
  let str = property.toLowerCase()
  str = str.startsWith('-ms-') ? str.substring(1) : str
  return str.replace(regex, callback)
})
