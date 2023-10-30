/**
 * Recursively wraps each value in a { value: xxx } object
 */
export const wrapValue = (obj: Record<string, any>) => {
  const newObj: Record<string, any> = {}

  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      newObj[key] = wrapValue(obj[key]) // Recursive call for nested objects
    } else {
      newObj[key] = { value: obj[key] }
    }
  }

  return newObj
}
