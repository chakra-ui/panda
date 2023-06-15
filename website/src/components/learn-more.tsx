import Link from 'next/link'
import { css } from '@/styled-system/css'
import { hstack } from '@/styled-system/patterns'
import { ButtonIcon } from '@/theme/icons'

export function LearnMore({ href = '/learn' }: { href?: string }) {
  return (
    <Link
      href={href}
      className={hstack({
        alignSelf: 'flex-start',
        textStyle: 'panda.h4',
        fontWeight: 'bold',
        flexShrink: '0'
      })}
    >
      Learn more
      <ButtonIcon className={css({ width: '6' })} icon="RightArrowIcon" />
    </Link>
  )
}
