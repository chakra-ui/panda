import { isObject, isString } from '@pandacss/shared'

const REFERENCE_REGEX = /({([^}]*)})/g
const curlyBracketRegex = /[{}]/g

export const isValidToken = (token: unknown) => Object.hasOwnProperty.call(token, 'value')
export const isTokenReference = (value: unknown) => typeof value === 'string' && REFERENCE_REGEX.test(value)

export const formatPath = (path: string) => path
export const SEP = '.'

export function getReferences(value: string) {
  if (typeof value !== 'string') return []

  const matches = value.match(REFERENCE_REGEX)
  if (!matches) return []

  return matches
    .map((match) => match.replace(curlyBracketRegex, ''))
    .map((value) => {
      return value.trim().split('/')[0]
    })
}

export const serializeTokenValue = (value: any): string => {
  if (isString(value)) {
    return value
  }

  if (isObject(value)) {
    return Object.values(value)
      .map((v) => serializeTokenValue(v))
      .join(' ')
  }

  if (Array.isArray(value)) {
    return value.map((v) => serializeTokenValue(v)).join(' ')
  }

  return value.toString()
}
