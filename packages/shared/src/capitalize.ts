export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const dashCase = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
