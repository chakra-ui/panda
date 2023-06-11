import { Portal, Tooltip, TooltipContent, TooltipPositioner, TooltipTrigger } from '@ark-ui/react'
import type { ReactElement, ReactNode } from 'react'

export const QuickTooltip = ({ children, tooltip }: { children: ReactElement; tooltip: ReactNode }) => {
  return (
    <Tooltip openDelay={0} closeDelay={100} positioning={{ placement: 'bottom-start', gutter: 20 }}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <Portal>
        <TooltipPositioner>
          <TooltipContent>{tooltip}</TooltipContent>
        </TooltipPositioner>
      </Portal>
    </Tooltip>
  )
}
