export function getPublicUrl() {
  const host =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
      ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      : process.env.NEXT_PUBLIC_VERCEL_URL
  const vercelUrl = host ? `https://${host}` : undefined
  const publicUrl = process.env.NEXT_PUBLIC_URL || vercelUrl
  return publicUrl || 'http://localhost:3000'
}
