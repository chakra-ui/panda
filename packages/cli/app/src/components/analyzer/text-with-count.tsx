import type { PropsWithChildren } from 'react'
import { panda } from '../../../design-system/jsx'
import type { JsxStyleProps } from '../../../design-system/types'

import { Portal, Tooltip, TooltipContent, TooltipPositioner, TooltipTrigger } from '@ark-ui/react'
import { truncate } from '../../utils/truncate'

export const TextWithCount = ({ children, count, ...props }: PropsWithChildren<{ count: number } & JsxStyleProps>) => {
  return (
    <panda.div display="inline-flex" alignItems="center" {...props}>
      <panda.span>{children}</panda.span>
      <Sup>({count})</Sup>
    </panda.div>
  )
}

export const TruncatedText = ({
  text,
  characters = 24,
  ...props
}: { text: string; characters?: number } & JsxStyleProps) => {
  if (text.length > characters) {
    return (
      <Tooltip openDelay={0} closeDelay={100} positioning={{ placement: 'bottom-start', gutter: 20 }}>
        <TooltipTrigger>
          <span>
            <panda.span {...props}>{text.substring(0, characters) + '...'}</panda.span>
          </span>
        </TooltipTrigger>
        <Portal>
          <TooltipPositioner>
            <TooltipContent>
              <panda.span p="2" bgColor="white" border="1px solid rgba(0, 0, 0, 0.1)">
                {truncate(text, 80)}
              </panda.span>
            </TooltipContent>
          </TooltipPositioner>
        </Portal>
      </Tooltip>
    )
  }

  return text as unknown as JSX.Element
}

const Sup = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <panda.sup
      fontSize="75%"
      lineHeight={0}
      position="relative"
      top="-0.35em"
      opacity="0.5"
      ml="1"
      className={className}
    >
      {children}
    </panda.sup>
  )
}
