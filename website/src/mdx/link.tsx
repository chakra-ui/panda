import { css, cx } from '@/styled-system/css'
import { Anchor } from '../nextra'
import type { AnchorProps } from '../nextra/anchor'

const EXTERNAL_HREF_REGEX = /https?:\/\//

const styles = css({
  color: 'primary.600',
  textDecorationLine: 'underline',
  textDecorationThickness: 'from-font',
  textUnderlinePosition: 'from-font'
})

export const Link = ({ href = '', className, ...props }: AnchorProps) => (
  <Anchor
    href={href}
    newWindow={EXTERNAL_HREF_REGEX.test(href)}
    className={cx(styles, className)}
    {...props}
  />
)

export const A = ({ href = '', ...props }: AnchorProps) => (
  <Anchor href={href} newWindow={EXTERNAL_HREF_REGEX.test(href)} {...props} />
)
