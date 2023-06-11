export const truncate = (str: string, length = 15) => {
  if (str.length > length) {
    return str.substring(0, length) + '...'
  }

  return str
}
