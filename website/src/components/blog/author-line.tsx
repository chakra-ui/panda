import { avatarUrl, resolveAuthors } from '@/lib/authors'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Image from 'next/image'

interface Props {
  authors?: string[]
  readingTime?: number
  size?: 'sm' | 'md'
  /**
   * Links each author to their X profile. Off inside post cards, which are
   * already a link, because an anchor cannot contain another anchor.
   */
  linked?: boolean
}

const avatar = css({
  rounded: 'full',
  borderWidth: '2px',
  borderColor: 'bg',
  bg: 'bg.muted'
})

const handle = css({
  textStyle: 'sm',
  color: 'fg.muted',
  textDecoration: 'none',
  _hover: { color: 'fg' }
})

export function AuthorLine(props: Props) {
  const { authors, readingTime, size = 'sm', linked } = props
  const people = resolveAuthors(authors)
  const px = size === 'md' ? 36 : 24

  if (people.length === 0 && !readingTime) return null

  if (linked) {
    return (
      <Box display="flex" flexWrap="wrap" gap="6" alignItems="center">
        {people.map(person => (
          <Box key={person.login} display="flex" alignItems="center" gap="3">
            <Image
              src={avatarUrl(person.login, px * 2)}
              alt=""
              width={px}
              height={px}
              className={avatar}
            />
            <Stack gap="0">
              <Box textStyle="sm" fontWeight="medium">
                {person.name}
              </Box>
              {person.x && (
                <a
                  href={person.x.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={handle}
                >
                  {person.x.username}
                </a>
              )}
            </Stack>
          </Box>
        ))}
        {readingTime ? (
          <Box textStyle="sm" color="fg.subtle">
            {readingTime} min read
          </Box>
        ) : null}
      </Box>
    )
  }

  return (
    <Box display="flex" alignItems="center" gap="3" flexWrap="wrap">
      {people.length > 0 && (
        <Box display="flex" alignItems="center" gap="2.5">
          <Box display="flex">
            {people.map((person, index) => (
              <Image
                key={person.login}
                src={avatarUrl(person.login, px * 2)}
                alt=""
                width={px}
                height={px}
                className={avatar}
                style={{ marginInlineStart: index === 0 ? 0 : -8 }}
              />
            ))}
          </Box>
          <Box textStyle="sm" color="fg.muted">
            {people.map(person => person.name).join(', ')}
          </Box>
        </Box>
      )}

      {readingTime ? (
        <>
          <Box aria-hidden color="fg.subtle">
            ·
          </Box>
          <Box textStyle="sm" color="fg.subtle">
            {readingTime} min read
          </Box>
        </>
      ) : null}
    </Box>
  )
}
