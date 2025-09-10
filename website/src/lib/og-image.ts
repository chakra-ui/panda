import { getPublicUrl } from './public-url'

interface OgImageParams {
  title?: string
  description?: string
  category?: string
}

export function generateOgImageUrl(params: OgImageParams): string {
  const baseUrl = getPublicUrl()
  const ogUrl = new URL(`${baseUrl}/og`)
  
  if (params.title) {
    ogUrl.searchParams.set('title', params.title)
  }
  
  if (params.description) {
    ogUrl.searchParams.set('description', params.description)
  }
  
  if (params.category) {
    ogUrl.searchParams.set('category', params.category)
  }
  
  return ogUrl.toString()
}