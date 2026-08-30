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
  const px = size === 'md' ? 32 : 24

  if (people.length === 0 && !readingTime) return null

  // Everyone gets a card and the row wraps, so a release with ten authors
  // credits all ten rather than hiding them behind a +N.
  if (linked) {
    return (
      <Stack gap="3">
        <Box textStyle="sm" color="fg.subtle">
          Posted by
        </Box>
        <Box display="flex" flexWrap="wrap" columnGap="8" rowGap="4">
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
        </Box>
      </Stack>
    )
  }

  // Compact variant, used in listings: a few faces, then a count.
  const MAX_FACES = 3
  const MAX_NAMES = 2
  const faces = people.slice(0, MAX_FACES)
  const hiddenFaces = people.length - faces.length
  const namedPeople = people.slice(0, MAX_NAMES)
  const hiddenNames = people.length - namedPeople.length

  const byline = namedPeople.map(person => person.name).join(', ')
  const credit = hiddenNames > 0 ? `${byline} +${hiddenNames} more` : byline

  return (
    <Box display="flex" alignItems="center" gap="3" flexWrap="wrap">
      {people.length > 0 && (
        <Box display="flex" alignItems="center" gap="2.5">
          <Box display="flex" flexShrink="0">
            {faces.map((person, index) => (
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
            {hiddenFaces > 0 && (
              <Box
                className={avatar}
                display="flex"
                alignItems="center"
                justifyContent="center"
                w={`${px}px`}
                h={`${px}px`}
                ms="-8px"
                bg="bg.muted"
                color="fg.muted"
                textStyle="xs"
                fontWeight="medium"
              >
                +{hiddenFaces}
              </Box>
            )}
          </Box>
          <Box textStyle="sm" color="fg.muted">
            {credit}
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
