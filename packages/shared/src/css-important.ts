export const isImportant = (value: string) => /!(important)?$/.test(value)

export const withoutImportant = (value: string) =>
  typeof value === 'string' ? value.replace(/!(important)?$/, '').trim() : value
