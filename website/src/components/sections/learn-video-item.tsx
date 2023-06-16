import { css, cx } from '@/styled-system/css'
import { Circle, HStack, Stack, panda } from '@/styled-system/jsx'
import { float, linkBox, linkOverlay } from '@/styled-system/patterns'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  title: string
  duration: string
  url: string
  thumbnail: string
  comingSoon?: boolean
}

export const LearnVideoItem = (props: Props) => {
  const { title, duration, thumbnail, url, comingSoon } = props
  return (
    <Stack gap="6" className={cx('group', linkBox())}>
      <panda.div
        w="100%"
        h="240px"
        bg="bg.main"
        borderRadius="xl"
        overflow="hidden"
        position="relative"
      >
        <Image
          width="400"
          height="240"
          className={css({
            objectFit: 'cover',
            transition: 'scale 0.2s ease-in-out',
            _groupHover: { scale: '1.05' }
          })}
          src={thumbnail}
          alt={title}
        />
      </panda.div>

      <Circle
        bg="white"
        size="12"
        fontSize="lg"
        color="black"
        className={float({ placement: 'top-end', offset: '12' })}
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 24 24"
          aria-hidden="true"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
            clipRule="evenodd"
          />
        </svg>
      </Circle>

      <Stack gap="0">
        <HStack>
          <panda.span
            textStyle="2xl"
            fontWeight="semibold"
            letterSpacing="tight"
          >
            <Link className={linkOverlay()} href={url}>
              {title}
            </Link>
          </panda.span>
          {comingSoon && <panda.span>Coming soon</panda.span>}
        </HStack>
        <panda.span color="bg.muted" fontWeight="medium" letterSpacing="tight">
          {duration}
        </panda.span>
      </Stack>
    </Stack>
  )
}
