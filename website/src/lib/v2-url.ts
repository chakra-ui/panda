export const v2Url = (
  process.env.NEXT_PUBLIC_V2_URL || 'https://panda-css.com'
).replace(/\/$/, '')

export function getV2Href(pathname: string) {
  return `${v2Url}${pathname}`
}
