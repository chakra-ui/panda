export const getUrl = (path?: string) => {
  const base = import.meta.env.BASE_URL || '/'
  if (!path) return base

  // Remove leading slash from path if base already ends with slash
  const cleanPath = base.endsWith('/') && path.startsWith('/') ? path.slice(1) : path

  return base + cleanPath
}
