export const stringifyJson = (config: Record<string, any>) => {
  return JSON.stringify(config, (_key, value) => {
    if (typeof value === 'function') return value.toString()
    return value
  })
}

export const parseJson = (config: string) => {
  return JSON.parse(config)
}
