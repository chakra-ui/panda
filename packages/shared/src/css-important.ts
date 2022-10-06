export function isImportant(value: string) {
  return typeof value === 'string' ? /!(important)?$/.test(value) : false
}

export function withoutImportant(value: string) {
  return typeof value === 'string' ? value.replace(/!(important)?$/, '').trim() : value
}

export function withoutSpace(str: string) {
  return typeof str === 'string' ? str.replaceAll(' ', '_') : str
}
