export function toHash(str: string) {
  let value = 5381
  let len = str.length
  while (len--) value = (value * 33) ^ str.charCodeAt(len)
  return (value >>> 0).toString(36)
}
