export function isImportant(value: string) {
  return /!(important)?$/.test(value)
}

export function withoutImportant(value: string) {
  return typeof value === 'string' ? value.replace(/!(important)?$/, '').trim() : value
}

export function withoutSpace(str: string) {
  return typeof str === 'string' ? str.replace(/\s/g, '_') : str
}
