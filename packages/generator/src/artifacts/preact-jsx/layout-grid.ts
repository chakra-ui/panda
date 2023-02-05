import { outdent } from 'outdent'

export function generatePreactLayoutGrid() {
  return {
    dts: outdent`
    import { FunctionComponent } from 'preact'

    export type LayoutGridProps = {
      count?: number
      gutter?: string
      maxWidth?: string
      margin?: string
      outline?: boolean
    }

    export declare const LayoutGrid: FunctionComponent<LayoutGridProps>
    `,
    js: outdent`
    import { h } from 'preact'

    export function LayoutGrid(props) {
      const { count = 12, margin, gutter = '24px', maxWidth, outline } = props
      const hasMaxWidth = maxWidth != null
      return h('div', {
        className: 'panda-layout-grid',
        style: {
          '--gutter': gutter,
          '--count': count,
          '--max-width': hasMaxWidth ? maxWidth : 'initial',
          '--margin-x': hasMaxWidth ? 'auto' : undefined,
          '--padding-x': !hasMaxWidth ? margin : undefined,
        },
        children: Array.from({ length: count }).map((_, i) =>
        h('span', {
            'data-variant': outline ? 'outline' : 'bg',
            key: i,
            className: 'panda-layout-grid__item',
          }),
        ),
      });
    }
    `,
  }
}
