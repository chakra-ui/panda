import { css, cx } from "@/styled-system/css"
import { ReactElement } from "react"
import { useConfig } from '@/contexts'
import { renderComponent } from '@/utils'

export function Separator({ title }: { title: string }): ReactElement {
  const config = useConfig()

  return (
    <li
      className={cx(
        css({ wordBreak: 'break-word' }),
        title
          ? css({
              mt: 5,
              mb: 2,
              px: 2,
              py: 1.5,
              textStyle: 'sm',
              fontWeight: 'semibold',
              color: 'gray.900',
              _first: { mt: 0 },
              _dark: { color: 'gray.100' }
            })
          : css({ my: 4 })
      )}
    >
      {title ? (
        renderComponent(config.sidebar.titleComponent, {
          title,
          type: 'separator',
          route: ''
        })
      ) : (
        <hr
          className={css({
            mx: 2,
            borderTopWidth: '1px',
            borderTopColor: 'gray.200',
            // _dark: { borderTopColor: 'primary.100/10' }
            _dark: { borderTopColor: 'rgb(219 234 254 / 0.1)' } // TODO opacity modifier
          })}
        />
      )}
    </li>
  )
}
