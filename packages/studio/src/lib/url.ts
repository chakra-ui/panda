export const getUrl = (path?: string) => {
  return [import.meta.env.BASE_URL, path].filter(Boolean).join('')
}
