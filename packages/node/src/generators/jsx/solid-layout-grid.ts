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
    }

    export declare const LayoutGrid: ParentProps<LayoutGridProps>
    `,
    js: outdent`
    import { createComponent, For } from 'solid-js/web'

    export function LayoutGrid(props) {
      const { count = 12, margin, gutter = '24px', maxWidth } = props
      const hasMaxWidth = maxWidth != null
      return createComponent('div', {
        style: {
          display: 'grid',
          gap: gutter,
          'grid-template-columns': \`repeat(\${count}, 1fr)\`,
          height: '100%',
          width: '100%',
          position: 'absolute',
          inset: '0',
          'pointer-events': 'none',
          'max-width': hasMaxWidth ? maxWidth : 'initial',
          'margin-inline': hasMaxWidth ? 'auto' : undefined,
          'padding-inline': !hasMaxWidth ? margin : undefined,
        },
        get children() {
          return createComponent(For, {
            get each() {
              return Array.from({ length: count })
            },
            children: () =>
              createComponent('span', {
                style: {
                  display: 'flex',
                  background: 'rgba(255, 0, 0, 0.1)',
                  height: '100%',
                },
              }),
          })
        },
      })
    }
    
    `,
  }
}
