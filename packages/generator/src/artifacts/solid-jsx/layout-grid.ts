import { outdent } from 'outdent'

export function generateSolidLayoutGrid() {
  return {
    dts: outdent`
    import type { ParentProps } from 'solid-js'
    
    export type LayoutGridProps = {
      count?: number
      gutter?: string
      maxWidth?: string
      margin?: string
      outline?: boolean
    }

    export declare const LayoutGrid: ParentProps<LayoutGridProps>
    `,
    js: outdent`
    import { createComponent, For } from 'solid-js/web'

    export function LayoutGrid(props) {
      const { count = 12, margin, gutter = '24px', maxWidth, outline } = props
      const hasMaxWidth = maxWidth != null
      return createComponent('div', {
        className: 'panda-layout-grid',
        style: {
          '--gutter': gutter,
          '--count': count,
          '--max-width': hasMaxWidth ? maxWidth : 'initial',
          '--margin-x': hasMaxWidth ? 'auto' : undefined,
          '--padding-x': !hasMaxWidth ? margin : undefined,
        },
        get children() {
          return createComponent(For, {
            get each() {
              return Array.from({ length: count })
            },
            children: () =>
              createComponent('span', {
                'data-variant': outline ? 'outline' : 'bg',
                className: 'panda-layout-grid__item',
              }),
          })
        },
      })
    }
    
    `,
  }
}
