export const isValidToken = (token: unknown) => Object.hasOwnProperty.call(token, 'value')
export const isTokenReference = (value: unknown) => typeof value === 'string' && value.startsWith('{')

export const formatPath = (path: string) => path
export const SEP = '.'
