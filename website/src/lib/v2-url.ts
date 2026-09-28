const v2Url = process.env.NEXT_PUBLIC_V2_URL || 'https://panda-css.com'

export function getV2Href(pathname = '/') {
  return `${v2Url.replace(/\/$/, '')}${pathname}`
}
