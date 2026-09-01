import type { AnchorProps } from '@/components/ui/anchor'
import { Anchor } from '@/components/ui/anchor'
import { cx } from '@/styled-system/css'
import { textLink } from '@/styled-system/recipes'

const EXTERNAL_HREF_REGEX = /https?:\/\//

export const Link = ({ href = '', className, ...props }: AnchorProps) => (
  <Anchor
    href={href}
    newWindow={EXTERNAL_HREF_REGEX.test(href)}
    className={cx(textLink(), className)}
    {...props}
  />
)
