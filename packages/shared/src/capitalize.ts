export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const camelCaseRegex = /([a-z])([A-Z])/g
export const dashCase = (s: string) => s.replace(camelCaseRegex, '$1-$2').toLowerCase()
export const uncapitalize = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
