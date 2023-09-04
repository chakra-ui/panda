export const createRegex = (item: Array<string | RegExp>) => {
  const regex = item.map((item) => (typeof item === 'string' ? `^${item}$` : item.source)).join('|')
  return new RegExp(regex)
}
