import type { AnchorProps } from '@/components/ui/anchor'
import { Anchor } from '@/components/ui/anchor'
import { css, cx } from '@/styled-system/css'

const EXTERNAL_HREF_REGEX = /https?:\/\//

const styles = css({
  color: 'link',
  fontWeight: 'medium',
  textUnderlineOffset: '2px',
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
