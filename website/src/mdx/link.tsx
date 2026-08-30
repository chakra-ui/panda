import type { AnchorProps } from '@/components/ui/anchor'
import { Anchor } from '@/components/ui/anchor'
import { css, cx } from '@/styled-system/css'

const EXTERNAL_HREF_REGEX = /https?:\/\//

const styles = css({
  color: 'fg',
  fontWeight: 'medium',
  textDecorationLine: 'underline',
  textDecorationColor: 'accent.emphasis',
  textDecorationThickness: '1px',
  textUnderlineOffset: '3px',
  transitionProperty: 'text-decoration-color, background-color',
  transitionDuration: '150ms',
  _hover: {
    textDecorationThickness: '1px',
    bg: 'accent.wash'
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '2px'
  }
})

export const Link = ({ href = '', className, ...props }: AnchorProps) => (
  <Anchor
    href={href}
    newWindow={EXTERNAL_HREF_REGEX.test(href)}
    className={cx(styles, className)}
    {...props}
  />
)
