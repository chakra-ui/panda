import { useRouter } from 'next/router'

export const GitTimestamp = ({ timestamp }) => {
  const { locale = 'en-US' } = useRouter()
  return (
    <>
      Last updated on{' '}
      <time dateTime={timestamp.toISOString()} suppressHydrationWarning>
        {timestamp.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </time>
    </>
  )
}
