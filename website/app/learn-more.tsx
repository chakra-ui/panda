import Link from 'next/link'
import { css } from '../styled-system/css'
import { hstack } from '../styled-system/patterns'
import { ButtonIcon } from '../theme/icons'

export function LearnMore() {
  return (
    <Link
      href="/learn"
      className={hstack({
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
